const path = require('path');
const fs = require('fs').promises;
const fileType = require('file-type');
const encryptFile = require('../utils/encrypt');
const EncryptedFile = require('../models/encrypModel.js');

const fileUpLoader = async function (req, res) {
  let tempOutputPath;
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send('Please upload a file');
    }

    // Read file buffer
    const fileBuffer = await fs.readFile(file.path);

    // Try to detect file type from buffer
    let detectedType = await fileType.fromBuffer(fileBuffer);

    // Fallback for plain text and similar files with no magic bytes
    if (!detectedType) {
      detectedType = { mime: file.mimetype };
    }

    const allowedTypes = [
      'text/plain',
      'application/json',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/mpeg',
      'video/webm',
      'application/pdf'
    ];

    // Block unsupported files
    if (!allowedTypes.includes(detectedType.mime)) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(400).send('Unsupported or invalid file type');
    }

    // Check for mismatch between detected and reported MIME type
    if (detectedType.mime !== file.mimetype) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(400).send('MIME type mismatch');
    }

    // Original uploaded file path
    const inputPath = file.path;

    // Temporary encrypted file path
    tempOutputPath = path.join(
      __dirname,
      '../encrypted',
      `${Date.now()}-${file.originalname}.enc`
    );

    // Encrypt the file
    const { key, iv } = await encryptFile(inputPath, tempOutputPath);

    // Read encrypted data
    const encryptedData = await fs.readFile(tempOutputPath);

    // MongoDB 16MB limit check
    if (encryptedData.length > 16 * 1024 * 1024) {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(tempOutputPath).catch(() => {});
      return res.status(400).send('Encrypted file size exceeds 16MB MongoDB limit');
    }

    // Save to MongoDB with owner reference
    const encryptedFile = new EncryptedFile({
      filename: file.originalname,
      data: encryptedData,
      mimetype: file.mimetype,
      uploadedAt: new Date(),
      encryptionKey: key,
      encryptionIV: iv,
      owner: req.user._id   // 👈 track the logged-in user
    });

    await encryptedFile.save();

    // Cleanup temp files
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(tempOutputPath).catch(() => {});

    res.status(200).json({
      message: 'File uploaded and encrypted successfully',
      fileId: encryptedFile._id
    });

  } catch (err) {
    console.error(err);
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    if (tempOutputPath) {
      await fs.unlink(tempOutputPath).catch(() => {});
    }
    res.status(500).send('Server error');
  }
};

module.exports = fileUpLoader;
