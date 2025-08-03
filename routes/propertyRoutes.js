const express = require('express');
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', propertyController.getAllProperties);
router.get('/:id', propertyController.getProperty);

// Protected routes
router.use(authMiddleware.protect);
router.post('/', propertyController.upload.array('images', 5), propertyController.createProperty);
router.put('/:id', propertyController.upload.array('images', 5), propertyController.updateProperty);
router.delete('/:id', propertyController.deleteProperty);

module.exports = router;
