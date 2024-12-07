const svgCaptcha = require("svg-captcha");
const crypto = require("crypto");
const os = require("os");
const networkInterfaces = os.networkInterfaces();

class Generator {
  static generateSecretKey(config = {}) {
    const macAddresses =
      Object.values(networkInterfaces)
        .flat()
        .filter((iface) => iface.family === "IPv4" && !iface.internal)
        .map((iface) => iface.mac)
        .join("-") || "00:00:00:00:00:00";
    const hostname = os.hostname();
    const configString = JSON.stringify(config);
    const uniqueIdentifier = `${hostname}-${macAddresses}-kfHLBA8l2N6IXkT7-${configString}`;
    return crypto
      .createHash("sha256")
      .update(uniqueIdentifier)
      .digest("hex")
      .slice(0, 64);
  }

  static generateCaptcha() {
    const captcha = svgCaptcha.create({
      size: 6,
      noise: 6,
      color: true,
      background: "#ffffff",
      fontSize: 50,
      width: 200,
      height: 60,
      ignoreChars: "0o1I",
      charPreset: "abcdefghijklmnopqrstuvwxyz0123456789",
    });

    return {
      dataURI: captcha.data,
      text: captcha.text,
    };
  }
}

module.exports = Generator;
