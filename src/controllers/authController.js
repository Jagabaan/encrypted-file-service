
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('Email already in use');

    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      token: generateToken(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid credentials');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).send('Invalid credentials');

    res.json({
      message: 'Login successful',
      token: generateToken(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
