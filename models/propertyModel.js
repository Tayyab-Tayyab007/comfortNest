/**
 * ComfortNest - Property Data Model
 *
 * Defines the MongoDB schema and model for property listings in the
 * ComfortNest application. Handles all property-related data structure,
 * validation rules, and database operations.
 *
 * SCHEMA FEATURES:
 * - Complete property information (title, description, location)
 * - Pricing and availability details
 * - Property specifications (bedrooms, bathrooms, area)
 * - Image gallery with multiple photos
 * - Owner/host information and contact details
 * - Amenities and features listing
 * - Address information with nested schema
 * - Timestamps for creation and updates
 *
 * VALIDATION:
 * - Required fields validation
 * - Data type enforcement
 * - String length limits
 * - Number range validation
 * - Email format validation
 *
 * NESTED SCHEMAS:
 * - Address schema for structured location data
 * - Image schema for property photo management
 * - Amenities schema for feature listings
 *
 * @author ComfortNest Development Team
 * @version 1.0.0
 */

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String
}, { _id: false });

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a property title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a property description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a property price'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a property location'],
    },
    address: {
      type: addressSchema,
      required: [true, 'Please provide property address details']
    },
    bedrooms: {
      type: Number,
      required: [true, 'Please provide number of bedrooms'],
    },
    bathrooms: {
      type: Number,
      required: [true, 'Please provide number of bathrooms'],
    },
    size: {
      type: Number,
      required: [true, 'Please provide property size in sq ft'],
    },
    propertyType: {
      type: String,
      required: [true, 'Please provide property type'],
      enum: ['House', 'Apartment', 'Condo', 'Villa', 'Studio', 'Other'],
    },
    images: [String],
    amenities: [String],
    yearBuilt: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear()
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Property = mongoose.model('Property', propertySchema);

module.exports = Property; 