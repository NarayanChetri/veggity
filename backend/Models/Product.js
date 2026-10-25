const mongoose = require('mongoose');
require('./User');

const ProductSchema = new mongoose.Schema({
    // Name of the produce
    title: {
        type: String,
        required: true
    },
    // Category
    category: {
        type: String,
        enum: [
            'Leafy Vegetables',
            'Fruit Vegetables',
            'Root Vegetables',
            'Bulb Vegetables',
            'Herbs',
            'Other Vegetables'
        ],
        required: true
    },
    // Price and quantity
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, required: true },

    // Perishability and expiry timestamp
    harvestDate: { type: Date, default: Date.now },
    shelfLifeDays: { type: Number, required: true },
    expiresAt: { type: Date, required: true },

    // Human-readable location
    locationArea: { type: String, required: true },

    // Geospatial coordinates GeoJSON standard
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true // [longitude, latitude]
        }
    },

    // Relational link to seller
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },

    // Rich listing details
    imageUrl: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    harvestMethod: {
        type: String,
        default: '100% Chemical-Free Homegrown'
    },
    rating: {
        type: Number,
        default: 4.8
    },
    ratingCount: {
        type: Number,
        default: 14
    },

    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// Critical: tells mongodb to build a spherical geometry index on the location field
ProductSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('products', ProductSchema);
