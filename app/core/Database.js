const mysql = require("mysql2/promise");

class Database {
  constructor(config) {
    this.pool = mysql.createPool({
      host: config.DATABASE.HOST,
      user: config.DATABASE.USERNAME,
      password: config.DATABASE.PASSWORD,
      database: config.DATABASE.NAME,
    });
  }

  async getConnection() {
    try {
      const conn = await this.pool.getConnection();
      return conn;
    } catch {
      return false;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = Database;
