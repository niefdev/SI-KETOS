require("dotenv").config();

const defaultConfig = {
  ACCOUNT: {
    PASSWORD: "siketos@admin",
  },
  WEBSERVER: {
    PORT: 80,
  },
  DATABASE: {
    USERNAME: "root",
    PASSWORD: "",
    HOST: "localhost",
    PORT: 3306,
    NAME: "si_ketos",
  },
};

const config = {
  ACCOUNT: {
    PASSWORD: String(process.env.PASSWORD) || defaultConfig.ACCOUNT.PASSWORD,
  },
  WEBSERVER: {
    PORT:
      parseInt(process.env.WEBSERVER_PORT, 10) || defaultConfig.WEBSERVER.PORT,
  },
  DATABASE: {
    USERNAME:
      String(process.env.DB_USERNAME) || defaultConfig.DATABASE.USERNAME,
    PASSWORD:
      String(process.env.DB_PASSWORD) || defaultConfig.DATABASE.PASSWORD,
    HOST: String(process.env.DB_HOST) || defaultConfig.DATABASE.HOST,
    PORT: parseInt(process.env.DB_PORT, 10) || defaultConfig.DATABASE.PORT,
    NAME: String(process.env.DB_NAME) || defaultConfig.DATABASE.NAME,
  },
};

module.exports = config;
