const axios = require('axios');
var path = require('path');
const fs = require('fs');
var FormData = require('form-data');
const { verifyWebhook } = require('../modules/AbridgeUtils');
const DbApi = require("./DbApi");

const ABRIDGE_API_HOST = process.env.abridge_api_host;

class AbridgeApi {
  static _instance;
  static getInstance() {
    if (AbridgeApi._instance == null) {
      AbridgeApi._instance = new AbridgeApi();
    }
    return AbridgeApi._instance;
  }
  
  async verifyWebhook(payload, abridgeSignature, secret) {
    return await verifyWebhook(payload, abridgeSignature, secret? secret : process.env.abridge_signing_secret);
  }

  async fetchAccessToken() {
    try {
      let statsObj = fs.statSync(path.join(__dirname, "/../accessToken.log"));
      if (statsObj && (Date.now() - (new Date(statsObj.mtime)).getTime()) <= 7200000) {
        let data = fs.readFileSync(path.join(__dirname, "/../accessToken.log"), 'utf8', 'w+');
        return data;
      }
    } catch (e) {}
    var data = JSON.stringify({
      "client_id": process.env.abridge_client_id,
      "grant_type": "client_credentials",
      "scope": "v1"
    });
    var config = {
      method: 'post',
      url: `${ABRIDGE_API_HOST}/v1/oauth2/token`,
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Basic ' + process.env.abridge_base64_client_id_and_secret
      },
      data : data
    };
    try {
      let { data } = await axios(config);
      //console.log(data);
      try {
        fs.writeFileSync(path.join(__dirname, "/../accessToken.log"), data.access_token, 'utf8', 'w+');
      } catch (e) {}
      return data.access_token;
    } catch (e) {
      console.log(e.message);
      throw e.message;
    }
  }

  async createEncounter(externalId) {
    try {
      var token = await this.fetchAccessToken();
      var payload = JSON.stringify({
        "externalId": externalId
      });
      var config = {
        method: 'post',
        url: `${ABRIDGE_API_HOST}/v1/notes/new`,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer ' + token
        },
        data : payload
      };
      let { data } = await axios(config);
      console.log('createEncounter', data);
      return data.data;
    } catch (e) {
      console.error(e.message);
      throw e.message;
    }
  }

  async uploadAudio(encounterId, filename) {
    try {
      console.log('uploadAudio ...', encounterId, filename);
      var token = await this.fetchAccessToken();
      var formData = new FormData();
      formData.append('audiofile', fs.createReadStream(filename));
      var config = {
        method: 'post',
        url: `${ABRIDGE_API_HOST}/v1/notes/${encounterId}/upload/audio`,
        headers: {
          'Authorization': 'Bearer ' + token,
          ...formData.getHeaders()
        },
        data : formData
      };
      //console.log(config)
      let { data } = await axios(config);
      console.log('uploadAudio ... done');
      //console.log(data);
      return true;
    } catch (e) {
      console.error(e.message);
      throw e.message;
    }
  }

  async getEncounter(encounterId) {
    try {
      var token = await this.fetchAccessToken();
      var config = {
        method: 'get',
        url: `${ABRIDGE_API_HOST}/v1/notes/${encounterId}`,
        headers: { 
          'Authorization': 'Bearer ' + token
        }
      };
      let { data } = await axios(config);
      //console.log(data);
      return data.data;
    } catch (e) {
      console.log(e.message);
      throw e.message;
    }
  }

  async storeDb(data) {
    try {
      const res = await DbApi.query(
        `INSERT INTO encounters(id, external_id, status, note, transcript)` 
        + `VALUES($1, $2, $3, $4, $5)`
        + `ON CONFLICT (id) `
        + `DO UPDATE SET status=$3, note=$4, transcript=$5, updated_at = NOW()`, 
        [
          data.id,
          data.externalId,
          data.status? data.status : null,
          data.note? data.note : null,
          data.transcript? data.transcript : null
        ]
      );
      if (res.rowCount === 0) throw "failed to storeDb";
      else {
        return true;
      }
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  async findDbById(encounterId) {
    try {
      const res = await DbApi.query(`SELECT * FROM encounters WHERE id = '${encounterId}'`);
      if (res.rowCount === 0) throw "not found with findDbById";
      else {
        let data = res.rows[0];
        //console.log(data);
        data.note = JSON.parse(data.note)
        data.transcript = JSON.parse(data.transcript);
        return data;
      }
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
}

var abridgeApi = AbridgeApi.getInstance();
module.exports = abridgeApi;