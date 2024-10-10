const sharp = require("sharp");

class Parser {
  static validateSeed(seed) {
    const asciiReadable = /^[\x21-\x7E]{8}$/;
    return asciiReadable.test(seed);
  }

  static validateVoter(voter) {
    const voterInt = parseInt(voter, 10);
    return Number.isInteger(voterInt) && voterInt <= 10240 && 1 <= voter;
  }

  static async validateCandidate(name, description, photo, urut) {
    if (!name || !description || !photo || !urut) {
      return false;
    }

    name = name.replace(/\r/g, "");
    description = description.replace(/\r/g, "");

    if (/\s\s+/.test(name) || /\s\s\s+/.test(description)) {
      return false;
    }

    if (name.length > 64 || description.length > 1024) {
      return false;
    }

    const urutNumber = parseInt(urut, 10);
    if (isNaN(urutNumber) || urutNumber < 1 || urutNumber > 8) {
      return false;
    }

    try {
      const metadata = await sharp(photo.data).metadata();
      const validFormats = ["jpeg", "png"];
      if (!validFormats.includes(metadata.format)) {
        return false;
      }

      if (metadata.width < 200 || metadata.height < 200) {
        return false;
      }

      await sharp(photo.data).resize(200).toBuffer();
    } catch {
      return false;
    }

    return true;
  }
}

module.exports = Parser;
