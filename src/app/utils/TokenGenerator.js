const crypto = require("crypto");
const seedrandom = require("seedrandom");

class TokenGenerator {
  #key;

  constructor(key) {
    if (key.length < 8) {
      throw new Error("Key must be at least 8 characters long.");
    }
    this.#key = key;
  }

  generate(inputNumber) {
    if (inputNumber < 1 || inputNumber > 10240) {
      return false;
    }

    const base32Value = this.#base32Encode(inputNumber);
    const paddedBase32 = base32Value.padStart(3, "a");

    const hashWithKeyValue = this.#hashWithKey(paddedBase32).substring(0, 5);
    const hashKeyValue = this.#hashWithKey(this.#key).substring(0, 8);
    const combined = paddedBase32 + hashWithKeyValue;

    const seed = this.#calculateSeed(combined);
    const shuffledToken = this.#shuffleWithSeed(combined, seed).toUpperCase();
    return this.#xorBase32(shuffledToken, hashKeyValue).toUpperCase();
  }

  verify(token) {
    const unscrambledToken = token.toLowerCase();
    const hashKeyValue = this.#hashWithKey(this.#key).substring(0, 8);
    const combined = this.#xorBase32(unscrambledToken, hashKeyValue);

    const seed = this.#calculateSeed(combined);
    const unshuffledToken = this.#unshuffleWithSeed(combined, seed);
    const plaintext = unshuffledToken.substring(0, 3);
    const hashWithKeyValue = unshuffledToken.substring(3);
    const generatedHash = this.#hashWithKey(plaintext).substring(0, 5);

    return generatedHash === hashWithKeyValue
      ? this.#base32Decode(plaintext)
      : false;
  }

  #base32Encode(number) {
    const base32Chars = "abcdefghijklmnopqrstuvwxyz234567";
    let result = "";

    while (number > 0) {
      const remainder = number % 32;
      result = base32Chars[remainder] + result;
      number = Math.floor(number / 32);
    }

    return result || "aaa";
  }

  #hashWithKey(data) {
    const hash = crypto.createHash("sha256");
    hash.update(data + this.#key);
    const hashedValue = hash.digest("hex");
    return this.#base32Encode(parseInt(hashedValue, 16));
  }

  #xorBase32(part1, part2) {
    const base32Chars = "abcdefghijklmnopqrstuvwxyz234567";
    let result = "";
    const paddedPart2 = part2.padEnd(part1.length, "a");

    for (let i = 0; i < part1.length; i++) {
      const char1 = base32Chars.indexOf(part1[i].toLowerCase());
      const char2 = base32Chars.indexOf(paddedPart2[i]);
      result += base32Chars[char1 ^ char2];
    }

    return result;
  }

  #base32Decode(base32) {
    const base32Chars = "abcdefghijklmnopqrstuvwxyz234567";
    let result = 0;

    for (let i = 0; i < base32.length; i++) {
      const charValue = base32Chars.indexOf(base32[i]);
      result = result * 32 + charValue;
    }

    return result;
  }

  #shuffleWithSeed(str, seed) {
    const arr = str.split("");
    const rng = seedrandom(seed);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join("");
  }

  #unshuffleWithSeed(shuffledString, seed) {
    const arr = shuffledString.split("");
    const original = new Array(arr.length);
    const rng = seedrandom(seed);
    const indices = Array.from({ length: arr.length }, (_, index) => index);

    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    indices.forEach((index, i) => {
      original[index] = arr[i];
    });

    return original.join("");
  }

  #calculateSeed(base32) {
    const hexChars = base32.match(/[0-9]/g) || [];
    const hash = crypto.createHash("sha256");
    hash.update(
      hexChars.length ** (base32.length - hexChars.length) * 2 + this.#key
    );
    const hashVal = hash.digest("base64");
    return hashVal;
  }
}

module.exports = TokenGenerator;
