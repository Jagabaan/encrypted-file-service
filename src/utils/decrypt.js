const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream');
const { createGunzip } = require('zlib');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const decryptFile = async (inputFile, outputFile, key, iv) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputFile)) {
      return reject(new Error(`Input file not found: ${inputFile}`));
    }

    ensureDir(outputFile);

    // 🔑 Convert hex strings back into Buffers if needed
    const keyBuffer = Buffer.isBuffer(key) ? key : Buffer.from(key, 'hex');
    const ivBuffer = Buffer.isBuffer(iv) ? iv : Buffer.from(iv, 'hex');

    // ✅ Validate sizes
    if (keyBuffer.length !== 32) {
      return reject(new Error(`Invalid key length: ${keyBuffer.length} bytes (expected 32)`));
    }
    if (ivBuffer.length !== 16) {
      return reject(new Error(`Invalid IV length: ${ivBuffer.length} bytes (expected 16)`));
    }

    // Skip first 16 bytes (IV) in file since it was prepended during encryption
    const input = fs.createReadStream(inputFile, { start: 16 });
    const decipher = crypto.createDecipheriv('aes-256-ctr', keyBuffer, ivBuffer);
    const output = fs.createWriteStream(outputFile);

    pipeline(
      input,
      decipher,
      createGunzip(),
      output,
      (err) => {
        if (err) return reject(err);
        resolve(outputFile);
      }
    );
  });
};

module.exports = decryptFile;
