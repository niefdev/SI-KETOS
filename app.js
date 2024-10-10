const express = require("express");
const session = require("express-session");
const Database = require("./app/core/Database");
const Routes = require("./app/middleware/Routes");
const Generator = require("./app/utils/Generator");
const MySQLStore = require("express-mysql-session")(session);
const config = require("./config/config");
const fileupload = require("express-fileupload");

const db = new Database(config);
const sessionStore = new MySQLStore({}, db.pool);
const app = express();

app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));
app.use(express.static("public"));
app.use(fileupload());
app.use(
  session({
    secret: Generator.generateSecretKey(config),
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { secure: false },
  })
);

app.set("views", "./app/views");
app.set("view engine", "ejs");

app.use((err, req, res, next) => {
  return res.status(500).render("error", {
    code: 500,
    message: "Terdapat kesalahan internal pada server.",
  });
});

app.use(async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    req.dbConnection = connection;
    next();
  } catch (error) {
    return res.status(500).render("error", {
      code: 500,
      message: "Terdapat kesalahan internal pada server.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.use(new Routes(config).router);

app.use((req, res, next) => {
  return res.status(404).render("error", {
    code: 404,
    message: "Halaman tidak ditemukan",
  });
});

process.on("uncaughtException", (err) => {
  console.error("[!] Uncaught Exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[!] Unhandled Rejection:", reason);
  process.exit(1);
});

app.listen(config.WEBSERVER.PORT, () => {
  console.log(`[*] OK, RUNNING ON :${config.WEBSERVER.PORT} ...`);
});
