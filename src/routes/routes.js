const express = require('express');
const router = express.Router();
const upload = require('../middleware/multer.js');
const fileUpLoader = require('../controllers/uploadFile.js');
const fileDownloader = require('../controllers/downloadFile.js');
const { register, login } = require('../controllers/authController.js');
const authMiddleware = require('../middleware/authMiddleware');

// 🔓 Public routes (no auth required)
router.post('/register', register);
router.post('/login', login);

// 🔒 Protected routes (must be logged in with JWT)
router.post('/fileupload', authMiddleware, upload.single('file'), fileUpLoader);
router.get('/downfile/:fileId', authMiddleware, fileDownloader);

module.exports = router;
