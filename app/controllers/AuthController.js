let Generator = require("../utils/Generator");
let TokenGenerator = require("../utils/TokenGenerator");
let VariableModel = require("../models/VariableModel");
let CandidateModel = require("../models/CandidateModel");
let VoterModel = require("../models/VoterModel");

let crypto = require("crypto");

class AuthController {
  static async login(req, res, truePassword) {
    try {
      let { password, captcha, admin } = req.body;

      if (admin == "true") {
        if (captcha == req.session.captchaText && password == truePassword) {
          req.session.login = true;
          return res.json({ message: true });
        }
        return res.status(401).json({ message: "Captcha atau password salah" });
      }

      admin = parseInt(admin, 10);

      if (isNaN(admin) || admin <= 0 || admin > 8) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let CandidateObj = new CandidateModel(req.dbConnection);
      let VariableObj = new VariableModel(req.dbConnection);
      let VoterObj = new VoterModel(req.dbConnection);

      let variables = await VariableObj.viewVariable();

      if (!variables) throw Error();

      variables = Object.fromEntries(
        variables.map((item) => [item.key, item.value])
      );

      if (variables.phase != 2) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let candidate = await CandidateObj.viewCandidate();

      if (!candidate || (candidate.length + 1 < admin && admin <= 0)) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let TokenObj = new TokenGenerator(variables.seed);

      let token = await TokenObj.verify(password);

      if (
        !token ||
        token <= 0 ||
        token > variables.voter ||
        captcha != req.session.captchaText
      ) {
        return res.status(401).json({ message: "Captcha atau token salah" });
      }

      let add = await VoterObj.addVoter(token, admin);

      if (!add) {
        return res.status(400).json({ message: "Token sudah digunakan" });
      }

      return res.status(200).json({
        redirect: `/verified/${password}?hash=${crypto
          .createHash("sha256")
          .update(password + variables.seed)
          .digest("hex")
          .substring(0, 8)}`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan saat mengambil data.",
      });
    }
  }

  static logout(req, res) {
    req.session.login = false;
    return res.json({ message: true });
  }

  static captcha(req, res) {
    const { dataURI, text } = Generator.generateCaptcha();

    req.session.captchaText = text;
    req.session.captchaTime = Date.now();

    res.setHeader("Content-Type", "image/svg+xml");
    res.send(dataURI);
  }
}

module.exports = AuthController;
