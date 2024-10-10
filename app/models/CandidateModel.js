const ImageManager = require("../models/ImageManager");

class CandidateModel {
  constructor(connection) {
    this.connection = connection;
  }

  async viewCandidateWithVoter(order = "") {
    try {
      const [rows] = await this.connection.query(
        "SELECT k.id, k.nama, COUNT(p.id) AS total FROM kandidat k LEFT JOIN pemilih p ON k.id = p.kandidat GROUP BY k.id, k.nama"
      );
      return rows;
    } catch {
      return false;
    }
  }

  async viewCandidate(order = "") {
    try {
      const [rows] = await this.connection.query(
        "SELECT * FROM kandidat WHERE id = ? OR ? = ''",
        [order, order]
      );
      return rows;
    } catch {
      return false;
    }
  }

  async deleteCandidate(candidateId) {
    try {
      await this.connection.beginTransaction();

      const [candidates] = await this.connection.query(
        "SELECT id FROM kandidat ORDER BY id ASC"
      );

      if (candidates.length === 0) {
        throw Error();
      }

      const candidateIds = candidates.map((c) => c.id);
      const maxId = Math.max(...candidateIds);

      if (!candidateIds.includes(candidateId)) {
        throw Error();
      }

      for (let i = candidateId; i < maxId; i++) {
        const stop = await this.updateCandidateOrder(i, 0);
        if (!stop) {
          throw Error();
        }
      }

      await this.connection.query("DELETE FROM kandidat WHERE id = ?", [maxId]);
      await this.connection.query("DELETE FROM foto WHERE id = ?", [maxId]);

      let refreshed = ImageManager.refresh(this.connection);

      if (!refreshed) {
        throw Error();
      }

      await this.connection.commit();

      return true;
    } catch {
      await this.connection.rollback();
      return false;
    }
  }

  async updateCandidateOrder(order, up) {
    const candidateId = order;
    const swapCandidateId = up === 1 ? order - 1 : order + 1;

    await this.connection.beginTransaction();

    try {
      const [candidates] = await this.connection.query(
        "SELECT id FROM kandidat WHERE id IN (?, ?)",
        [candidateId, swapCandidateId]
      );

      if (candidates.length !== 2) {
        await this.connection.rollback();
        return false;
      }

      const tempId = 9;

      await this.connection.query("UPDATE kandidat SET id = ? WHERE id = ?", [
        tempId,
        candidateId,
      ]);

      await this.connection.query("UPDATE kandidat SET id = ? WHERE id = ?", [
        candidateId,
        swapCandidateId,
      ]);

      await this.connection.query("UPDATE kandidat SET id = ? WHERE id = ?", [
        swapCandidateId,
        tempId,
      ]);

      await this.connection.query("UPDATE foto SET id = ? WHERE id = ?", [
        tempId,
        candidateId,
      ]);

      await this.connection.query("UPDATE foto SET id = ? WHERE id = ?", [
        candidateId,
        swapCandidateId,
      ]);

      await this.connection.query("UPDATE foto SET id = ? WHERE id = ?", [
        swapCandidateId,
        tempId,
      ]);

      await this.connection.commit();
      return true;
    } catch {
      await this.connection.rollback();
      return false;
    }
  }

  async saveCandidate(name, description, photo, urut) {
    try {
      await this.connection.beginTransaction();

      await this.connection.query("INSERT INTO foto (id, foto) VALUES (?, ?)", [
        urut,
        photo.data,
      ]);

      await this.connection.query(
        "INSERT INTO kandidat (id, nama, deskripsi) VALUES (?, ?, ?)",
        [urut, name, description]
      );

      await this.connection.commit();
      return true;
    } catch {
      await this.connection.rollback();

      try {
        await this.connection.beginTransaction();

        await this.connection.query(
          "UPDATE kandidat SET nama = ?, deskripsi = ? WHERE id = ?",
          [name, description, urut]
        );

        await this.connection.query("UPDATE foto SET foto = ? WHERE id = ?", [
          photo.data,
          urut,
        ]);

        await this.connection.commit();
        return true;
      } catch {
        await this.connection.rollback();
        return false;
      }
    }
  }

  async getPhoto(order) {
    try {
      const [rows] = await this.connection.query(
        "SELECT foto FROM foto WHERE id = ?",
        [order]
      );
      return rows;
    } catch {
      return false;
    }
  }
}

module.exports = CandidateModel;
