/**
 * ComfortNest Property Rental Application - Main Server File
 *
 * This is the main server file for the ComfortNest property rental application.
 * It sets up the Express server, connects to MongoDB, configures middleware,
 * and handles routing for both API endpoints and static file serving.
 *
 * Features:
 * - RESTful API for properties and users
 * - MongoDB database integration with Mongoose
 * - User authentication and authorization with JWT
 * - File upload handling for property images
 * - Static file serving for frontend assets
 * - CORS enabled for cross-origin requests
 * - Request logging with Morgan
 * - Environment-based configuration
 *
 * @author ComfortNest Development Team
 * @version 1.0.0
 * @since 2024
 */

// Load environment variables at the very top to ensure they're available
const path = require('path');              // Node.js path utilities for file paths
const dotenv = require("dotenv");          // Environment variable loader

// Load environment variables from .env file
const result = dotenv.config({ path: path.join(__dirname, '.env') });
if (result.error) {
  console.error("Error loading .env file:", result.error);
}

// Log environment variables for debugging (without exposing sensitive values)
console.log("Environment variables:", {
  PORT: process.env.PORT || '(not set)',
  MONGO_URI: process.env.MONGO_URI ? '(set)' : '(not set)',
  JWT_SECRET: process.env.JWT_SECRET ? '(set)' : '(not set)',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '(not set)'
});

// Import required Node.js modules and third-party packages
const express = require('express');        // Fast, unopinionated web framework
const mongoose = require('mongoose');      // MongoDB object modeling for Node.js
const cors = require('cors');              // Cross-Origin Resource Sharing middleware
const morgan = require('morgan');          // HTTP request logger middleware

// Import application route modules
const userRoutes = require('./routes/userRoutes');         // User authentication and management routes
const propertyRoutes = require('./routes/propertyRoutes'); // Property CRUD operation routes

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;     // Server port from environment or default to 5000

// CORS configuration
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));  // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, './')));

// Serve the face-api.js models with correct content type
app.use('/public/models', express.static(path.join(__dirname, 'public', 'models'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        } else {
            res.setHeader('Content-Type', 'application/octet-stream');
        }
    }
}));

// Health check endpoint (no authentication required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);

// API Error handling middleware (must come after API routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`
  });
});

// Global error handling middleware for API routes
app.use((err, req, res, next) => {
  // Only handle API errors with JSON response
  if (req.originalUrl.startsWith('/api/')) {
    console.error('API Error:', err);

    // Handle Multer errors (file upload errors)
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum file size is 10MB per file.'
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please check your form.'
      });
    }

    if (err.message && err.message.includes('not a valid image type')) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (err.message === 'Error: Images Only!') {
      return res.status(400).json({
        success: false,
        message: 'Only image files (JPEG, PNG, GIF, WebP, AVIF, BMP, TIFF) are allowed.'
      });
    }

    // Handle different types of errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field value entered'
      });
    }

    // Default server error
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  } else {
    // For non-API routes, pass to next middleware
    next(err);
  }
});

// Route for serving frontend (only for non-API routes)
app.get('*', (req, res) => {
  // Don't serve HTML for API routes
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  res.sendFile(path.join(__dirname, './index.html'));
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/property-rental-db')
  .then(async () => {
    console.log('MongoDB connected');
    
    // Create default admin user if it doesn't exist
    const User = require('./models/userModel');
    try {
      const existingAdmin = await User.findOne({ email: 'comfortnestproject@gmail.com' });
      if (!existingAdmin) {
        console.log('Creating default admin user...');
        await User.create({
          name: 'Admin',
          email: 'comfortnestproject@gmail.com',
          password: 'admin123',
          role: 'admin',
          phone: '+923239140684',
          isVerified: true
        });
        console.log('Default admin user created successfully');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const startServer = (port, retries = 5) => {
  if (retries === 0) {
    console.error('Could not find an open port after multiple retries.');
    process.exit(1);
    return;
  }

  const numericPort = parseInt(port, 10);

  const server = app.listen(numericPort, () => {
    console.log(`Server running on port ${numericPort}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${numericPort} is busy, trying port ${numericPort + 1}`);
      startServer(numericPort + 1, retries - 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);
