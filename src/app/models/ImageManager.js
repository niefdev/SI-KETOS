class ImageManager {
  constructor() {
    if (!ImageManager.instance) {
      this.images = {};
      this.initialized = false;
      ImageManager.instance = this;
    }
    return ImageManager.instance;
  }

  async refresh(connection) {
    try {
      const [rows] = await connection.query("SELECT * FROM foto");

      this.images = {};

      for (const row of rows) {
        this.set("photo_" + row.id, row.foto);
      }

      return true;
    } catch {
      return false;
    }
  }

  set(key, imageData) {
    this.images[key] = imageData;
  }

  del(key) {
    delete this.images[key];
  }

  async initialize(connection) {
    if (this.initialized) {
      return true;
    }

    let refreshed = await this.refresh(connection);

    if (refreshed) {
      this.initialized = true;
    }

    return refreshed;
  }

  get(key) {
    return this.images[key];
  }
}

module.exports = new ImageManager();
