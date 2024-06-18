// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

const app = express(); // Initialize Express app

app.use(bodyParser.json()); // Middleware to parse JSON

app.use('/api', apiRoutes); // Routes for API

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactionsDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected'); // Connection successful
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err); // Connection error
  });

const port = process.env.PORT || 5000; // Define port

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`); // Server running message
});
