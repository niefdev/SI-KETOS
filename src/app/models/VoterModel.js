class VoterModel {
  constructor(connection) {
    this.connection = connection;
  }

  async addVoter(id, candidate) {
    try {
      await this.connection.query(
        "INSERT INTO pemilih (id, kandidat) VALUES (?, ?)",
        [id, candidate]
      );
      return true;
    } catch {
      return false;
    }
  }

  async findVoter(id, candidate) {
    try {
      let [rows] = await this.connection.query(
        "SELECT id, kandidat, waktu FROM pemilih WHERE id = ?",
        [id]
      );
      return rows;
    } catch {
      return false;
    }
  }
}

module.exports = VoterModel;
