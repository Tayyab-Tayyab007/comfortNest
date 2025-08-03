const Property = require('../models/propertyModel');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads/property-images',
  filename: function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
});

exports.upload = upload;

// Check file type with enhanced validation
function checkFileType(file, cb){
  // Allowed extensions - including modern formats
  const filetypes = /jpeg|jpg|png|gif|webp|avif|bmp|tiff|tif/;

  // Allowed MIME types - including modern formats and variations
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/avif',
    'image/bmp',
    'image/tiff',
    'image/tif',
    'image/x-ms-bmp', // Alternative BMP MIME type
    'image/x-tiff',   // Alternative TIFF MIME type
    'image/x-tif'     // Alternative TIF MIME type
  ];

  // Get file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const extensionValid = filetypes.test(fileExtension);

  // Check MIME type (case insensitive)
  const mimetypeValid = allowedMimeTypes.includes(file.mimetype.toLowerCase());

  // Special handling for AVIF files (sometimes have different MIME types)
  const isAvif = fileExtension === '.avif' || file.mimetype.toLowerCase().includes('avif');

  // Special handling for WebP files
  const isWebP = fileExtension === '.webp' || file.mimetype.toLowerCase().includes('webp');

  console.log('File validation:', {
    filename: file.originalname,
    mimetype: file.mimetype,
    extension: fileExtension,
    extensionValid: extensionValid,
    mimetypeValid: mimetypeValid,
    isAvif: isAvif,
    isWebP: isWebP
  });

  // Accept file if either:
  // 1. Both extension and MIME type are valid
  // 2. It's a recognized modern format (AVIF/WebP) with correct extension
  if (mimetypeValid && extensionValid) {
    return cb(null, true);
  } else if ((isAvif || isWebP) && extensionValid) {
    console.log('Accepting modern image format:', file.originalname);
    return cb(null, true);
  } else {
    console.log('File rejected:', file.originalname, 'MIME:', file.mimetype, 'Extension:', fileExtension);
    cb(`Error: File "${file.originalname}" is not a valid image type. Only JPEG, PNG, GIF, WebP, AVIF, BMP, and TIFF are allowed.`);
  }
}

// Get all properties
exports.getAllProperties = async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'ownerName', 'ownerId', 'universalSearch'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Advanced filtering with proper AND logic
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // Parse the query object
    let parsedQuery = JSON.parse(queryStr);

    // Handle location filtering with case-insensitive partial matching
    if (req.query.location) {
      parsedQuery.location = {
        $regex: req.query.location,
        $options: 'i'
      };
    }

    console.log('MongoDB query with AND logic:', JSON.stringify(parsedQuery, null, 2));
    let query = Property.find(parsedQuery);

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50; // Increased default limit
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execute query with owner population
    let properties = await query.populate('owner', 'name email displayId isVerified phone');

    // Universal search functionality (case-insensitive)
    if (req.query.universalSearch) {
      const searchTerm = req.query.universalSearch.toLowerCase().trim();
      console.log('Performing case-insensitive universal search for:', searchTerm);

      properties = properties.filter(property => {
        // Search in property fields (all case-insensitive)
        const titleMatch = property.title && property.title.toLowerCase().includes(searchTerm);
        const locationMatch = property.location && property.location.toLowerCase().includes(searchTerm);
        const typeMatch = property.propertyType && property.propertyType.toLowerCase().includes(searchTerm);
        const descriptionMatch = property.description && property.description.toLowerCase().includes(searchTerm);

        // Search in price (convert to string for partial matches)
        const priceMatch = property.price && property.price.toString().toLowerCase().includes(searchTerm);

        // Search in bedrooms/bathrooms (convert to string)
        const bedroomsMatch = property.bedrooms && property.bedrooms.toString().includes(searchTerm);
        const bathroomsMatch = property.bathrooms && property.bathrooms.toString().includes(searchTerm);

        // Search in owner information (all case-insensitive)
        let ownerMatch = false;
        if (property.owner) {
          const ownerNameMatch = property.owner.name && property.owner.name.toLowerCase().includes(searchTerm);
          const ownerIdMatch = property.owner.displayId && property.owner.displayId.toLowerCase().includes(searchTerm);
          const ownerEmailMatch = property.owner.email && property.owner.email.toLowerCase().includes(searchTerm);
          const ownerPhoneMatch = property.owner.phone && property.owner.phone.toLowerCase().includes(searchTerm);
          ownerMatch = ownerNameMatch || ownerIdMatch || ownerEmailMatch || ownerPhoneMatch;
        }

        const matches = titleMatch || locationMatch || typeMatch || descriptionMatch ||
                       priceMatch || bedroomsMatch || bathroomsMatch || ownerMatch;

        if (matches) {
          console.log(`Property "${property.title}" matches search term "${searchTerm}"`);
        }

        return matches;
      });

      console.log(`Universal search found ${properties.length} matching properties`);
    }

    // Legacy filter support for backward compatibility
    else if (req.query.ownerName || req.query.ownerId) {
      properties = properties.filter(property => {
        if (!property.owner) return false;

        let matches = true;

        if (req.query.ownerName) {
          const ownerNameMatch = property.owner.name &&
            property.owner.name.toLowerCase().includes(req.query.ownerName.toLowerCase());
          matches = matches && ownerNameMatch;
        }

        if (req.query.ownerId) {
          const ownerIdMatch = (property.owner.displayId &&
            property.owner.displayId.toLowerCase().includes(req.query.ownerId.toLowerCase())) ||
            (property.owner._id &&
            property.owner._id.toString().toLowerCase().includes(req.query.ownerId.toLowerCase()));
          matches = matches && ownerIdMatch;
        }

        return matches;
      });
    }

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get properties for a specific user
exports.getUserProperties = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const properties = await Property.find({ owner: userId }).populate('owner', 'name email displayId isVerified phone');
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

// Get a single property
exports.getProperty = async (req, res) => {
  try {
    console.log('getProperty: req.params.id:', req.params.id);
    const property = await Property.findById(req.params.id).populate('owner', 'name email displayId isVerified phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create a new property
exports.createProperty = async (req, res) => {
    try {
        // Safeguard against missing user object
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'Authentication error: User not found. Please log in again.' });
        }

        const { title, description, price, location, street, city, state, zipCode, country, bedrooms, bathrooms, size, propertyType, amenities, yearBuilt } = req.body;

        const propertyData = {
            title,
            description,
            price,
            location,
            address: { street, city, state, zipCode, country },
            bedrooms,
            bathrooms,
            size,
            propertyType,
            owner: req.user._id,
            images: req.files ? req.files.map(file => `/uploads/property-images/${file.filename}`) : []
        };

        if (yearBuilt) {
            propertyData.yearBuilt = yearBuilt;
        }

        const newProperty = new Property(propertyData);
        const property = await newProperty.save();
        res.status(201).json({ success: true, data: property });
    } catch (error) {
        console.error('Full error object in createProperty:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }
        res.status(500).json({ success: false, message: 'Server error. Please check logs.' });
    }
};

// Update a property
exports.updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }

        if (property.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'User not authorized' });
        }

        const { title, description, price, location, street, city, state, zipCode, country, bedrooms, bathrooms, size, propertyType, yearBuilt, existingImages } = req.body;

        console.log('Updating property with data:', {
            title, description, price, location, street, city, state, zipCode, country,
            bedrooms, bathrooms, size, propertyType, yearBuilt
        });

        // Validate required fields
        if (!title || !description || !price || !location || !bedrooms || !bathrooms || !size || !propertyType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields. Please fill in all required information.'
            });
        }

        // Validate numeric fields
        if (isNaN(price) || isNaN(bedrooms) || isNaN(bathrooms) || isNaN(size)) {
            return res.status(400).json({
                success: false,
                message: 'Price, bedrooms, bathrooms, and size must be valid numbers.'
            });
        }

        // Update basic fields
        property.title = title;
        property.description = description;
        property.price = price;
        property.location = location;
        property.bedrooms = bedrooms;
        property.bathrooms = bathrooms;
        property.size = size;
        property.propertyType = propertyType;
        property.yearBuilt = yearBuilt;

        // Handle address object safely
        if (!property.address) {
            property.address = {};
        }

        property.address.street = street || property.address.street || '';
        property.address.city = city || property.address.city || '';
        property.address.state = state || property.address.state || '';
        property.address.zipCode = zipCode || property.address.zipCode || '';
        property.address.country = country || property.address.country || '';

        console.log('Updated address object:', property.address);

        // Handle images safely
        try {
            let updatedImages = [];
            if (existingImages) {
                if (typeof existingImages === 'string') {
                    updatedImages = JSON.parse(existingImages);
                } else if (Array.isArray(existingImages)) {
                    updatedImages = existingImages;
                }
            }

            if (req.files && req.files.length > 0) {
                const newImagePaths = req.files.map(file => `/uploads/property-images/${file.filename}`);
                updatedImages = [...updatedImages, ...newImagePaths];
                console.log('Added new images:', newImagePaths);
            }

            property.images = updatedImages;
            console.log('Final images array:', property.images);
        } catch (imageError) {
            console.error('Error processing images:', imageError);
            // Continue without failing the entire update
        }

        console.log('Saving property...');
        await property.save();
        console.log('Property saved successfully');

        res.status(200).json({ success: true, data: property });
    } catch (error) {
        console.error('Error updating property:', error);
        console.error('Error stack:', error.stack);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('Validation errors:', messages);
            return res.status(400).json({ success: false, message: messages.join('. ') });
        }

        if (error.name === 'CastError') {
            console.error('Cast error:', error.message);
            return res.status(400).json({ success: false, message: 'Invalid data format provided' });
        }

        res.status(500).json({
            success: false,
            message: 'Server error occurred while updating property',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


// Delete a property
exports.deleteProperty = async (req, res) => {
  try {
    console.log('Attempting to delete property with ID:', req.params.id);
    console.log('User requesting deletion:', req.user.email, 'Role:', req.user.role);

    const property = await Property.findById(req.params.id);

    if (!property) {
      console.log('Property not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Property not found',
      });
    }

    console.log('Property found:', property.title, 'Owner:', property.owner);

    // Check if user is property owner or admin
    if (property.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      console.log('Authorization failed. User:', req.user._id, 'Property owner:', property.owner, 'User role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this property',
      });
    }

    // Handle image cleanup gracefully (don't fail if images are missing)
    const fs = require('fs');
    const path = require('path');
    let imageCleanupWarnings = [];

    if (property.images && property.images.length > 0) {
      console.log('Attempting to clean up property images:', property.images);

      for (const imagePath of property.images) {
        try {
          // Convert image path to actual file path
          let actualPath = imagePath;
          if (imagePath.startsWith('/uploads/')) {
            actualPath = path.join(__dirname, '..', 'public', imagePath);
          } else if (imagePath.startsWith('/public/uploads/')) {
            actualPath = path.join(__dirname, '..', imagePath);
          } else {
            actualPath = path.join(__dirname, '..', 'public', 'uploads', 'property-images', imagePath);
          }

          // Check if file exists before trying to delete
          if (fs.existsSync(actualPath)) {
            fs.unlinkSync(actualPath);
            console.log('Successfully deleted image file:', actualPath);
          } else {
            console.log('Image file not found (already deleted):', actualPath);
            imageCleanupWarnings.push(`Image file not found: ${imagePath}`);
          }
        } catch (imageError) {
          console.error('Error deleting image file:', imagePath, imageError.message);
          imageCleanupWarnings.push(`Could not delete image: ${imagePath} - ${imageError.message}`);
          // Continue with deletion even if image cleanup fails
        }
      }
    }

    // Delete the property from database
    console.log('Deleting property from database...');
    await property.deleteOne();
    console.log('Property successfully deleted from database');

    // Prepare response message
    let message = 'Property deleted successfully';
    if (imageCleanupWarnings.length > 0) {
      message += '. Note: Some image files were already missing or could not be deleted.';
    }

    res.status(200).json({
      success: true,
      data: {},
      message: message,
      warnings: imageCleanupWarnings.length > 0 ? imageCleanupWarnings : undefined
    });

  } catch (error) {
    console.error('Error deleting property:', error);
    console.error('Error stack:', error.stack);

    // Provide more specific error messages
    let errorMessage = 'Failed to delete property';

    if (error.name === 'CastError') {
      errorMessage = 'Invalid property ID format';
    } else if (error.name === 'ValidationError') {
      errorMessage = 'Property validation error';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
