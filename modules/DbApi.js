const { Pool } = require("pg");

class DbApi {
    static _pool;
    static get pool() {
        if (DbApi._pool == null) {
          DbApi._pool = new Pool({ connectionString: process.env.DATABASE_URL});
        }
        return DbApi._pool;
    }
    static async query(str, args = null) {
        const client = await DbApi.pool.connect();
        try {
            const res = await client.query(str, args);
            return res;
        } catch (err) {
            console.error(err.code, err.message);
        } finally {
            client.release();
        }
    }

    static async migrate() {
        var str = `CREATE TABLE IF NOT EXISTS rooms(
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) DEFAULT NULL,
            session_id VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMPTZ DEFAULT Now(),
            updated_at TIMESTAMPTZ DEFAULT NULL
        )`;
        await DbApi.query(str);

        str = `CREATE TABLE IF NOT EXISTS encounters(
            id VARCHAR(255) PRIMARY KEY,
            external_id VARCHAR(255) DEFAULT NULL,
            note TEXT DEFAULT NULL,
            transcript TEXT DEFAULT NULL,
            status VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMPTZ DEFAULT Now(),
            updated_at TIMESTAMPTZ DEFAULT NULL
        )`;
        await DbApi.query(str);
      }
}

module.exports = DbApi;
