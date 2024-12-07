class VariableModel {
  constructor(connection) {
    this.connection = connection;
  }

  async viewVariable() {
    try {
      const [rows] = await this.connection.query("SELECT * FROM variabel");
      return rows;
    } catch {
      return false;
    }
  }

  async canEdit() {
    const [rows] = await this.connection.query(
      "SELECT 1 FROM variabel WHERE `key` = 'phase' AND value = 0"
    );

    if (rows.length == 0) {
      return false;
    }

    return true;
  }

  async setPhase(newPhase) {
    try {
      await this.connection.beginTransaction();

      await this.connection.query(
        `
        UPDATE variabel 
        SET value = ?
        WHERE \`key\` = 'phase'`,
        [newPhase]
      );

      await this.connection.query(`DELETE FROM pemilih WHERE 0 = ?`, [
        newPhase,
      ]);

      await this.connection.commit();

      return true;
    } catch (error) {
      await this.connection.rollback();
      return false;
    }
  }

  async setToken(newSeedValue, newVoter) {
    try {
      const [rows] = await this.connection.query(
        `
        UPDATE variabel 
        SET value = CASE 
            WHEN \`key\` = 'seed' THEN ?
            WHEN \`key\` = 'voter' THEN ?
        END
        WHERE \`key\` IN ('seed', 'voter')`,
        [newSeedValue, Number(newVoter)]
      );

      return true;
    } catch {
      return false;
    }
  }
}

module.exports = VariableModel;
