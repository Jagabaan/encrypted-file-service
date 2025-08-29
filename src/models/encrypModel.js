const mongoose = require('mongoose');

const EncryptedFileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  data: { type: Buffer, required: true },
  mimetype: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  encryptionKey: { type: String, required: true },
  encryptionIV: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // 🔑 track owner
});

module.exports = mongoose.model('EncryptedFile', EncryptedFileSchema);
