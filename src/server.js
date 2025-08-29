const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/connectDb.js');
const routes = require('./routes/routes.js');  // 👈 single routes file

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);  // 👈 all endpoints under /api

// Server
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
