const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const { pipeline } = require('stream/promises');
const decryptFile = require('../utils/decrypt');
const EncryptedFile = require('../models/encrypModel.js');

const fileDownloader = async (req, res) => {
  let tempEncryptedPath, tempDecryptedPath;

  try {
    const { fileId } = req.params;

    // 1. Find file in MongoDB
    const encryptedFile = await EncryptedFile.findById(fileId);
    if (!encryptedFile) {
      return res.status(404).json({ message: 'File not found' });
    }

    // 2. Prepare temp paths
    const tempDir = path.join(__dirname, '../temp');
    await fsp.mkdir(tempDir, { recursive: true });

    tempEncryptedPath = path.join(tempDir, `${Date.now()}-${encryptedFile.filename}.enc`);
    tempDecryptedPath = path.join(tempDir, encryptedFile.filename);

    // 3. Save encrypted file temporarily
    await fsp.writeFile(tempEncryptedPath, encryptedFile.data);

    // 4. Decrypt into temp file
    await decryptFile(
      tempEncryptedPath,
      tempDecryptedPath,
      encryptedFile.encryptionKey,
      encryptedFile.encryptionIV
    );

    // 5. Stream decrypted file to client
    res.setHeader('Content-Type', encryptedFile.mimetype);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${path.basename(encryptedFile.filename)}"`
    );

    const readStream = fs.createReadStream(tempDecryptedPath);
    await pipeline(readStream, res);

  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error downloading file' });
    }
  } finally {
    // 6. Always cleanup temp files
    if (tempEncryptedPath) await fsp.unlink(tempEncryptedPath).catch(() => {});
    if (tempDecryptedPath) await fsp.unlink(tempDecryptedPath).catch(() => {});
  }
};

module.exports = fileDownloader;
