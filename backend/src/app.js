const express = require('express');
const cors = require('cors');
const postsRoutes = require('./routes/posts');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());


// Branchement des routes
app.use('/api/posts', postsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;