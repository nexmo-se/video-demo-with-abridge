const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sign = require('jwt-encode');
const OpenTok = require('opentok');
const DbApi = require("./DbApi");

const APP_SERVER_HOST = process.env.APP_SERVER_HOST;
const apiKey = process.env.OT_API_KEY;
const apiSecret = process.env.OT_API_SECRET;

class OpenTokApi {
  static _instance;
  static getInstance() {
    if (OpenTokApi._instance == null) {
      OpenTokApi._instance = new OpenTokApi();
    }
    return OpenTokApi._instance;
  }
  constructor() {
    this.OT = new OpenTok(process.env.OT_API_KEY, process.env.OT_API_SECRET);
  }

  async startAudioStreamer(sessionId) {
    var jwt = await this.generateJwt(apiKey, apiSecret);
    var token = await this.generateToken(sessionId);
    var data = JSON.stringify({
      "sessionId": sessionId,
      "token": token,
      "websocket": {
        "uri": `wss://${APP_SERVER_HOST}/api/ws/recorder`,
        "headers": {
          "xSessionId": sessionId
        }
      }
    });
    var config = {
      method: 'post',
      url: `https://api.opentok.com/v2/project/${apiKey}/connect`,
      headers: { 
        'Content-Type': 'application/json', 
        'X-OPENTOK-AUTH': jwt
      },
      data : data
    };
    //console.log(data, config)
    try {
      let { data } = await axios(config);
      console.log(data);
      return data;
    } catch (e) {
      console.log(e.message, e.response);
      throw e.message;
    }
  }

  // == force disconnect 
  async stopAudioStreamer(sessionId, connectionId) {
    try {
      var jwt = await this.generateJwt(apiKey, apiSecret);
      var config = {
        method: 'delete',
        url: `https://api.opentok.com/v2/project/${apiKey}/session/${sessionId}/connection/${connectionId}`,
        headers: { 
          'Content-Type': 'application/json', 
          'X-OPENTOK-AUTH': jwt
        }
      };
      let { data } = await axios(config);
      console.log(data);
      return true;
    } catch (e) {
      console.log(e.message, e.response);
      throw e.message;
    }
  }

  async createSession() {
    try {
      return new Promise((resolve, reject) => {
        this.OT.createSession({ mediaMode: 'routed' }, function(error, session) {
          if (error) {
            console.log("Error creating session:", error)
            reject(error)
          } else {
            var sessionId = session.sessionId;
            resolve(sessionId);
          }
        });
      });
    } catch (e) {
      console.log(e.message, e.response);
      throw e.message;
    }
  }

  async generateToken(sessionId, name, role) {
    try {
      var token = this.OT.generateToken(sessionId, {
          role:       role? role : "publisher",
          expireTime: (new Date().getTime() / 1000) + (24 * 60 * 60), // one day
          data:       'name=' + name? name : ''
      });
      return token;
    } catch (e) {
      console.log(e.message, e.response);
      throw e;
    }
  }

  async generateJwt(API_KEY, API_SECRET) {
    try {
      var jwt_payload = {
        "iss": API_KEY,
        "ist": "project",
        "iat": Math.floor(Date.now() / 1000),
        "jti": uuidv4(),
        "exp": Math.floor(Date.now() / 1000) + 36000,
      };
      var jwt = sign(jwt_payload, API_SECRET);
      return jwt;
    } catch (e) {
      console.log(e.message, e.response);
      throw e.message;
    }
  }

  async dbFindRoomById(id) {
    try {
      const res = await DbApi.query(`SELECT * FROM medical_rooms WHERE id = '${id}'`);
      if (res.rowCount === 0) return null
      else {
        let data = res.rows[0];
        return data;
      }
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  async dbStore(data) {
    try {
      const res = await DbApi.query(
        `INSERT INTO medical_rooms(id, name, session_id)` 
        + `VALUES($1, $2, $3)`
        + `ON CONFLICT (id) `
        + `DO UPDATE SET name=$2, session_id=$3, updated_at = NOW()`, 
        [
          data.id,
          data.name,
          data.sessionId
        ]
      );
      if (res.rowCount === 0) throw "failed to dbStore";
      else {
        return true;
      }
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

}

var openTokApi = OpenTokApi.getInstance();
module.exports = openTokApi;