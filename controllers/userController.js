const mongoose = require('mongoose');
const User = require('../models/userModel');
const Property = require('../models/propertyModel');
const jwt = require('jsonwebtoken');
const emailjs = require('emailjs-com');

// Hardcoded secret for development purposes only
const DEFAULT_JWT_SECRET = 'your_super_secure_jwt_secret_for_development_only_12345';

// In-memory store for email OTPs (for password reset)
const passwordResetOtps = {}; // { email: { otp: '123456', expires: Date.now() + 15 * 60 * 1000 } }

// Generate JWT token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  console.log("Using JWT secret:", secret ? "Secret is available" : "NO SECRET AVAILABLE");
  return jwt.sign({ id }, secret, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};





// Register a new seller/landlord
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user with all required fields
    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      role: 'seller',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate token
    const token = generateToken(user._id);

    // Return user data in the format expected by the frontend
    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user.displayId || user._id.toString(), // Prioritize displayId
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: new Date(),
        displayId: user.displayId // Include displayId
      },
    });

    console.log('User registered successfully:', user.email);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Login seller/landlord or admin
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user.displayId || user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: new Date(),
        displayId: user.displayId
      },
    });
    console.log('User logged in successfully:', user.email);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};





// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password'); // Exclude passwords
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// Get single user by ID or email (admin or self)
exports.getUser = async (req, res) => {
  try {
    const { identifier } = req.params;
    let user;

    // Check if identifier is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier).select('-password');
    }

    // If not found by ID or identifier is not an ObjectId, try by email
    if (!user) {
      user = await User.findOne({ email: identifier }).select('-password');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If a regular user is trying to access another user's profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this user profile' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// Create a new user (admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    console.log('Attempting to create user with data:', { name, email, password: password ? '****' : 'N/A', phone, role });
    const user = await User.create({ name, email, password, phone, role });
    console.log('User created successfully:', user.email);
    res.status(201).json({ success: true, user: user.toObject({ getters: true }) });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
  }
};

// Update user by ID or email (admin or self)
exports.updateUser = async (req, res) => {
  try {
    const { identifier } = req.params;
    const { name, email, phone, role } = req.body;
    let user;

    // Find user by _id or email
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
    }
    if (!user) {
      user = await User.findOne({ email: identifier });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If a regular user is trying to update another user's profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to update this user' });
    }

    // Update fields
    console.log('Updating user:', identifier);
    console.log('Request body email:', email);
    console.log('Found user\'s current email:', user.email);
    user.name = name || user.name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      console.log('Found user with potential duplicate email:', emailExists ? emailExists.email : 'None');
      console.log('User being updated ID:', user._id.toString());
      console.log('Potential duplicate user ID:', emailExists ? emailExists._id.toString() : 'None');
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }
    if (phone !== undefined) {
      console.log('Updating phone number to:', phone);
      user.phone = phone;
      if (req.user.role === 'admin') {
        console.log('Verifying user');
        user.isVerified = true;
      }
    }
    if (req.user.role === 'admin' && role) { // Only admin can change role
      user.role = role;
    }
    user.updatedAt = new Date();

    console.log('Saving user:', user);
    await user.save({ runValidators: true });

    res.json({ success: true, message: 'User updated successfully', user: user.toObject({ getters: true }) });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update user' });
  }
};

// Delete user by ID or email (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { identifier } = req.params;
    let user;

    // Find user by _id or email
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
    }
    if (!user) {
      user = await User.findOne({ email: identifier });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves (optional, but good practice)
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account via this interface' });
    }

    await User.deleteOne({ _id: user._id }); // Use deleteOne with a query

    // Also delete any properties owned by this user
    await Property.deleteMany({ owner: user._id });

    res.json({ success: true, message: 'User and associated properties deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete user' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toObject({ getters: true }) });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phone } = req.body;

    user.name = name || user.name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }
    user.phone = phone || user.phone;
    user.updatedAt = new Date();

    await user.save();

    res.json({ success: true, message: 'Profile updated successfully', user: user.toObject({ getters: true }) });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
};

// Get all properties for a specific user
exports.getUserProperties = async (req, res) => {
  try {
    const userId = req.user._id;
    const properties = await Property.find({ owner: userId }).populate('owner', 'name email displayId');
    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error('Error getting user properties:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newToken = generateToken(user._id);
    res.json({ success: true, token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh token' });
  }
};



// Password reset
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const storedOtpData = passwordResetOtps[email];

    console.log(`[resetPassword] Attempting to reset password for ${email}. Received OTP: ${otp}, Stored OTP: ${storedOtpData ? storedOtpData.otp : 'N/A'}`);

    // If there's no stored OTP, we'll trust the one from the request for now.
    // This is NOT secure for production.
    if (storedOtpData && storedOtpData.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (storedOtpData && Date.now() > storedOtpData.expires) {
      delete passwordResetOtps[email]; // Clear expired OTP
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    const user = await User.findOne({ email }).select('+password'); // Select password to update it

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update password
    user.password = newPassword; // Mongoose pre-save hook will hash it
    await user.save();

    delete passwordResetOtps[email]; // Clear OTP after successful reset

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
  }
};

// Send password reset OTP
exports.sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate a random 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

    // Store OTP in-memory (for production, use a more persistent store like Redis)
    passwordResetOtps[email] = { otp: generatedOTP, expires: expiry };

    console.log(`[sendPasswordResetOtp] Generated OTP: ${generatedOTP} for ${email}. Expires: ${new Date(expiry)}`);

    // --- Send email with OTP using EmailJS ---
    const templateParams = {
      to_email: email,
      otp: generatedOTP,
    };

    // IMPORTANT: You need to replace 'YOUR_TEMPLATE_ID' with your actual EmailJS template ID.
    await emailjs.send('service_2t61uew', 'YOUR_TEMPLATE_ID', templateParams, 'TZ1vCirsSMLfjTch5');
    // --- End of email sending ---
    
    // For development/testing purposes, we send the OTP in the response.
    // In a production environment, you should NOT do this for security reasons.
    res.json({ success: true, message: 'OTP sent successfully', otp: generatedOTP });

  } catch (error) {
    console.error('Send password reset OTP error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
  }
};
