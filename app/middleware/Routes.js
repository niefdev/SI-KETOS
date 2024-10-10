const express = require("express");
const fs = require("fs");
const path = require("path");
const Auth = require("./Auth");

class Routes {
  constructor(config) {
    this.config = config;
    this.router = express.Router();
    this.initControllers();
    this.postRouters();
    this.getRouters();
  }

  initControllers() {
    const controllersDir = path.join(__dirname, "../controllers");
    fs.readdirSync(controllersDir).forEach((file) => {
      if (file.endsWith(".js")) {
        const controllerName = path.basename(file, ".js");
        this[controllerName] = require(path.join(controllersDir, file));
      }
    });
  }

  postRouters() {
    this.router.post("/", this.HomeController.detail);
    this.router.post("/auth/login", Auth.isNotAuthenticated, (req, res) =>
      this.AuthController.login(req, res, this.config.ACCOUNT.PASSWORD)
    );
    this.router.post(
      "/auth/logout",
      Auth.isAuthenticated,
      this.AuthController.logout
    );
    this.router.post(
      "/auth/captcha",
      Auth.isNotAuthenticated,
      this.AuthController.captcha
    );
    this.router.post(
      "/data/save",
      Auth.isAuthenticated,
      this.DataController.saveData
    );
    this.router.post(
      "/data/changeOrder",
      Auth.isAuthenticated,
      this.DataController.changeOrder
    );
    this.router.post(
      "/data/delete",
      Auth.isAuthenticated,
      this.DataController.deleteCandidate
    );
    this.router.post(
      "/data/tokens",
      Auth.isAuthenticated,
      this.DataController.downloadToken
    );
    this.router.post(
      "/confirm",
      Auth.isNotAuthenticated,
      this.VoteController.confirm
    );

    this.router.post("/data/image", this.DataController.viewPhoto);
    this.router.post("/data/view", this.DataController.viewData);
  }

  getRouters() {
    this.router.get("/", this.HomeController.index);
    this.router.get("/verified/:id", this.VoteController.verified);
    this.router.get(
      "/admin",
      (req, res, next) => {
        Auth.isAuthenticated(req, res, next, "login");
      },
      this.AdminController.index
    );
  }
}

module.exports = Routes;
