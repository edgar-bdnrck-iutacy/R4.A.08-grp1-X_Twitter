const express = require('express');
const cors = require('cors');
const path = require('path');
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Branchement des routes
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;