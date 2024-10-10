const VariableModel = require("../models/VariableModel");
const CandidateModel = require("../models/CandidateModel");

class HomeController {
  static async detail(req, res) {
    try {
      let VariableObj = new VariableModel(req.dbConnection);
      let CandidateObj = new CandidateModel(req.dbConnection);

      let variables = await VariableObj.viewVariable();

      if (!variables) throw Error();

      variables = Object.fromEntries(
        variables.map((item) => [item.key, item.value])
      );

      if (variables.phase == 2 || variables.phase == 1) {
        let urut = req.body.urut || 0;
        urut = parseInt(urut, 10);

        if (isNaN(urut) || urut < 1 || urut > 8) {
          return res.status(404).render("error", {
            code: 404,
            message: "Halaman tidak ditemukan",
          });
        }

        let candidate = await CandidateObj.viewCandidate();

        if (!candidate) throw Error();

        candidate = Object.fromEntries(
          candidate.map((item) => [
            item.id,
            { nama: item.nama, deskripsi: item.deskripsi },
          ])
        );

        if (!candidate[urut]) {
          return res.status(404).render("error", {
            code: 404,
            message: "Halaman tidak ditemukan",
          });
        }

        let htmlOutput = "";
        let inList = false;

        candidate[urut].deskripsi.split("\n").forEach((line) => {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith("-")) {
            if (!inList) {
              htmlOutput +=
                "<ul class='list-outside list-disc space-y-1 ps-5'>\n";
              inList = true;
            }
            htmlOutput += `<li>${trimmedLine.replace("- ", "")}</li>\n`;
          } else {
            if (inList) {
              htmlOutput += "</ul>\n";
              inList = false;
            }
            if (trimmedLine) {
              htmlOutput += `${trimmedLine}\n`;
            }
          }
        });

        if (inList) {
          htmlOutput += "</ul>\n";
        }

        return res.render("detail", {
          urut: urut,
          nama: candidate[urut].nama,
          deskripsi: htmlOutput,
          hidden:
            !(req.session && req.session.login) && variables.phase > 1
              ? ""
              : "hidden",
        });
      }

      return res.status(404).render("error", {
        code: 404,
        message: "Halaman tidak ditemukan",
      });
    } catch {
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan pada server.",
      });
    }
  }

  static async index(req, res) {
    try {
      let VariableObj = new VariableModel(req.dbConnection);

      let variables = await VariableObj.viewVariable();

      if (!variables) throw Error();

      variables = Object.fromEntries(
        variables.map((item) => [item.key, item.value])
      );

      if (variables.phase == 0) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      if (variables.phase == 3) {
        return res.render("result");
      }

      return res.render("home");
    } catch {
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan pada server.",
      });
    }
  }
}

module.exports = HomeController;
