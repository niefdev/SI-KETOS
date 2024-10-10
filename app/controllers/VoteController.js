const VariableModel = require("../models/VariableModel");
const CandidateModel = require("../models/CandidateModel");
const VoterModel = require("../models/VoterModel");
const TokenGenerator = require("../utils/TokenGenerator");
const crypto = require("crypto");

class VoteController {
  static async verified(req, res) {
    try {
      let VariableObj = new VariableModel(req.dbConnection);
      let VoterObj = new VoterModel(req.dbConnection);

      let variables = await VariableObj.viewVariable();

      if (!variables) throw Error();

      variables = Object.fromEntries(
        variables.map((item) => [item.key, item.value])
      );

      let TokenObj = new TokenGenerator(variables.seed);

      let id =
        typeof req.params.id === "string" && req.params.id.trim() !== ""
          ? req.params.id
          : "x";
      let hash =
        typeof req.query.hash === "string" && req.query.hash.trim() !== ""
          ? req.query.hash
          : "x";

      let decodedId = TokenObj.verify(id);

      if (
        !decodedId ||
        hash !=
          crypto
            .createHash("sha256")
            .update(id + variables.seed)
            .digest("hex")
            .substring(0, 8)
      ) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let voter = await VoterObj.findVoter(decodedId);

      if (!voter) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      const formatTanggal = (dateInput) =>
        new Date(dateInput)
          .toLocaleString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
          .replace(",", "")
          .replace(" ", " ")
          .replace(":", ".");

      return res.status(200).render("success", {
        token: id,
        voted: voter[0].kandidat,
        time: formatTanggal(voter[0].waktu),
      });
    } catch {
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan di server.",
      });
    }
  }

  static async confirm(req, res) {
    try {
      let VariableObj = new VariableModel(req.dbConnection);
      let CandidateObj = new CandidateModel(req.dbConnection);
      const urut = parseInt(req.body.urut || 0, 10);

      if (isNaN(urut) || urut < 0 || urut > 8) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

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
      if (!candidate || candidate.length + 1 < urut) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      return res.render("login", {
        header: "Pilih Kandidat",
        label: "TOKEN",
        admin: urut,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan di server.",
      });
    }
  }
}

module.exports = VoteController;
