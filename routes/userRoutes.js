const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Authentication routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/', protect, userController.getAllUsers); 
router.post('/', protect, userController.createUser); // Add route to create a user from admin dashboard
router.put('/:identifier', protect, userController.updateUser); // Add route to update a user from admin dashboard
router.delete('/:identifier', protect, userController.deleteUser); // Add route to delete a user from admin dashboard
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/properties', protect, userController.getUserProperties);
router.post('/refresh-token', protect, userController.refreshToken);

// Password reset
router.post('/send-password-reset-otp', userController.sendPasswordResetOtp);
router.post('/reset-password', userController.resetPassword);

module.exports = router;
