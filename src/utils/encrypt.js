require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream');
const { createGzip } = require('zlib');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const encryptFile = async (inputFile, outFile) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputFile)) {
      return reject(new Error(`Input file not found: ${inputFile}`));
    }

    ensureDir(outFile);

    const algo = 'aes-256-ctr';
    const key = crypto.randomBytes(32); // 256-bit key
    const iv = crypto.randomBytes(16);  // 128-bit IV

    const cipher = crypto.createCipheriv(algo, key, iv);

    const output = fs.createWriteStream(outFile);
    output.write(iv); // Write IV at the start of the file (optional if you also store separately)

    pipeline(
      fs.createReadStream(inputFile),
      createGzip(),
      cipher,
      output,
      (err) => {
        if (err) return reject(err);

        // ✅ Return hex strings instead of Buffers
        resolve({ 
          key: key.toString('hex'), 
          iv: iv.toString('hex') 
        });
      }
    );
  });
};

module.exports = encryptFile;
