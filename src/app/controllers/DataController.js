const CandidateModel = require("../models/CandidateModel");
const VariableModel = require("../models/VariableModel");
const Parser = require("../utils/Parser");
const TokenGenerator = require("../utils/TokenGenerator");
const ImageManager = require("../models/ImageManager");
const sharp = require("sharp");

class DataController {
  static async downloadToken(req, res) {
    try {
      let VariableObj = new VariableModel(req.dbConnection);

      let variables = await VariableObj.viewVariable();

      if (!variables) throw Error();

      variables = Object.fromEntries(
        variables.map((item) => [item.key, item.value])
      );

      let TokenGeneratorObj = new TokenGenerator(variables.seed);

      let tokens = [];

      for (let i = 1; i <= variables.voter; i++) {
        let token = await TokenGeneratorObj.generate(i);
        tokens.push(token);
      }

      res.set("Content-Type", "text/plain");
      return res.send(tokens.join("\n"));
    } catch {
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan saat mengambil data.",
      });
    }
  }

  static async viewData(req, res) {
    try {
      let CandidateObj = new CandidateModel(req.dbConnection);
      let VariableObj = new VariableModel(req.dbConnection);

      const accessScope = req.query.scope || 0;

      if (accessScope === "1") {
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

        let candidates =
          variables.phase == 3
            ? await CandidateObj.viewCandidateWithVoter()
            : await CandidateObj.viewCandidate();

        if (!candidates) throw Error();

        return res.json({
          candidate: candidates,
        });
      } else if (accessScope === "2") {
        let candidates = await CandidateObj.viewCandidate();
        if (!candidates) throw Error();

        if (req.session && req.session.login) {
          let variable = await VariableObj.viewVariable();

          if (variable === false) throw Error();

          return res.json({
            candidate: candidates,
            variable: variable.reduce((acc, { key, value }) => {
              acc[key] = !isNaN(value) ? parseInt(value, 10) : value;
              return acc;
            }, {}),
          });
        } else {
          return res.status(401).render("error", {
            code: 401,
            message: "Akses tidak diizinkan. Hanya admin yang dapat mengakses.",
          });
        }
      } else {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan saat mengambil data.",
      });
    }
  }

  static async viewPhoto(req, res) {
    let urut = req.query.urut || 0;
    urut = parseInt(urut, 10);

    if (isNaN(urut) || urut < 1 || urut > 8) {
      return res.status(404).render("error", {
        code: 404,
        message: "Halaman tidak ditemukan",
      });
    }

    try {
      let VariableObj = new VariableModel(req.dbConnection);

      if (!(req.session && req.session.login) && (await VariableObj.canEdit()))
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

    const photoKey = `photo_${urut}`;

    const initializeResult = await ImageManager.initialize(req.dbConnection);
    if (!initializeResult) {
      return res.status(500).render("error", {
        code: 500,
        message: "Gagal memperbarui foto",
      });
    }

    const photo = ImageManager.get(photoKey);

    if (photo) {
      const { format } = await sharp(photo).metadata();
      const mimeType = `image/${format}`;

      res.set("Content-Type", mimeType);
      return res.send(photo);
    } else {
      return res.status(404).render("error", {
        code: 404,
        message: "Halaman tidak ditemukan",
      });
    }
  }

  static async deleteCandidate(req, res) {
    try {
      let VariableObj = new VariableModel(req.dbConnection);

      if (!(await VariableObj.canEdit())) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let CandidateObj = new CandidateModel(req.dbConnection);
      let urut = parseInt(req.query.urut, 10);

      if (isNaN(urut) || urut < 1 || urut > 8) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let deleted = await CandidateObj.deleteCandidate(urut);

      if (!deleted) {
        return res.status(500).render("error", {
          code: 500,
          message: "Terjadi kesalahan saat menghapus data.",
        });
      }

      res.status(200).send("OK");
    } catch {
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan pada server.",
      });
    }
  }

  static async changeOrder(req, res) {
    try {
      let VariableObj = new VariableModel(req.dbConnection);

      if (!(await VariableObj.canEdit())) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let CandidateObj = new CandidateModel(req.dbConnection);

      const { order, up } = req.query;

      const orderNum = parseInt(order, 10);
      const upNum = parseInt(up, 10);

      if (isNaN(orderNum) || orderNum < 1 || orderNum > 8) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      if (isNaN(upNum) || (upNum !== 1 && upNum !== 0)) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      const success = await CandidateObj.updateCandidateOrder(orderNum, upNum);

      if (success) {
        let img1 = await ImageManager.get(`photo_${orderNum}`);
        let img2 = await ImageManager.get(
          `photo_${upNum == 1 ? orderNum - 1 : orderNum + 1}`
        );

        await ImageManager.set(`photo_${orderNum}`, img2);
        await ImageManager.set(
          `photo_${upNum === 1 ? orderNum - 1 : orderNum + 1}`,
          img1
        );

        res.status(200).send("OK");
        return;
      }

      return res.status(500).render("error", {
        code: 500,
        message: "Gagal mengubah urutan kandidat.",
      });
    } catch {
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan pada server.",
      });
    }
  }

  static async saveData(req, res) {
    try {
      const dataBeingSaved = ["phase", "candidate", "token"].includes(
        req.query.data || false
      )
        ? req.query.data
        : false;

      if (!dataBeingSaved) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      let VariableObj = new VariableModel(req.dbConnection);

      if (dataBeingSaved != "phase" && !(await VariableObj.canEdit())) {
        return res.status(404).render("error", {
          code: 404,
          message: "Halaman tidak ditemukan",
        });
      }

      if (dataBeingSaved == "phase") {
        let VariableObj = new VariableModel(req.dbConnection);
        let CandidateObj = new CandidateModel(req.dbConnection);

        let candidate = CandidateObj.viewCandidate();

        if (!candidate) throw Error();

        const { phase } = req.body;

        if (
          phase < 0 ||
          phase > 3 ||
          isNaN(phase) ||
          (phase == 1 && candidate.length < 2)
        ) {
          return res.status(403).render("error", {
            code: 403,
            message: "Halaman tidak ditemukan",
          });
        }

        let variable = await VariableObj.viewVariable();

        if (!variable) {
          return res.status(500).render("error", {
            code: 500,
            message: "Terjadi kesalahan saat mengambil data.",
          });
        }

        variable = Object.fromEntries(
          variable.map((item) => [item.key, item.value])
        );

        if (
          (variable.phase == 0 && phase != 1) ||
          (variable.phase == 1 && phase != 0 && phase != 2) ||
          (variable.phase == 2 && phase != 0 && phase != 3) ||
          (variable.phase == 3 && phase != 0)
        ) {
          return res.status(404).render("error", {
            code: 404,
            message: "Halaman tidak ditemukan",
          });
        }

        let save = await VariableObj.setPhase(phase);

        if (!save) {
          return res.status(500).render("error", {
            code: 500,
            message: "Terjadi kesalahan saat mengambil data.",
          });
        }

        return res.status(200).send("OK");
      }

      if (dataBeingSaved == "token") {
        let VariableObj = new VariableModel(req.dbConnection);

        const { seed, voter } = req.body;

        if (!Parser.validateSeed(seed) || !Parser.validateVoter(voter)) {
          return res.status(404).render("error", {
            code: 404,
            message: "Halaman tidak ditemukan",
          });
        }

        let set = await VariableObj.setToken(seed, voter);

        if (!set) {
          return res.status(500).render("error", {
            code: 500,
            message: "Terjadi kesalahan saat mengambil data.",
          });
        }

        res.status(200).send("OK");
      }

      if (dataBeingSaved == "candidate") {
        let CandidateObj = new CandidateModel(req.dbConnection);

        let { name, description, urut } = req.body;

        const photo = req.files.photo;

        if (!(await Parser.validateCandidate(name, description, photo, urut))) {
          return res.status(404).render("error", {
            code: 404,
            message: "Halaman tidak ditemukan",
          });
        }

        name = name.replace(/\r/g, "");
        description = description.replace(/\r/g, "");

        urut = typeof urut === "string" ? parseInt(urut, 10) : urut;

        let savedCandidate = await CandidateObj.viewCandidate();

        if (savedCandidate === false) {
          return res.status(500).render("error", {
            code: 500,
            message: "Terjadi kesalahan saat mengambil data.",
          });
        }

        savedCandidate.push({ urut: 0 });

        let urutMax = Math.max(...savedCandidate.map((item) => item.urut));

        if (
          (urutMax < 8 && (urut < 1 || urut > urutMax + 1)) ||
          (urutMax === 8 && (urut < 1 || urut > 8))
        ) {
          return res.status(404).render("error", {
            code: 404,
            message: "Halaman tidak ditemukan",
          });
        }

        let save = await CandidateObj.saveCandidate(
          name,
          description,
          photo,
          urut
        );

        if (!save) {
          return res.status(500).render("error", {
            code: 500,
            message: "Terjadi kesalahan saat mengambil data.",
          });
        }

        ImageManager.set(`photo_${urut}`, photo.data);

        return res.status(200).send("OK");
      }
    } catch {
      return res.status(500).render("error", {
        code: 500,
        message: "Terjadi kesalahan pada server.",
      });
    }
  }
}

module.exports = DataController;
