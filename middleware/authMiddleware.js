const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If token doesn't exist
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'You are not logged in. Please log in to access this resource',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from decoded token
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    // Set user on request object
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again',
    });
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
}; 