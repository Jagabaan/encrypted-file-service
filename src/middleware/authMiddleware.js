
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send('Access denied. No token.');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).send('Invalid token.');

    req.user = user; // attach user to request
    next();
  } catch (err) {
    res.status(401).send('Please authenticate');
  }
};

module.exports = authMiddleware;
