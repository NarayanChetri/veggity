const mongoose = require('mongoose');
require('./User');
require('./Product');

// Schema for Orders placed by buyers for grower's produce
const OrderSchema = new mongoose.Schema({
    // Buyer details
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    buyerName: {
        type: String,
        required: true
    },
    buyerPhone: {
        type: String,
        required: true
    },
    buyerAddress: {
        type: String,
        required: true
    },
    buyerLocality: {
        type: String,
        default: ''
    },

    // The grower/lister who receives and fulfills this order
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },

    // Produce items in this order
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products'
            },
            title: { type: String, required: true },
            category: { type: String, default: '' },
            price: { type: Number, required: true },
            unit: { type: String, default: 'kg' },
            quantity: { type: Number, required: true },
            itemTotal: { type: Number, required: true }
        }
    ],

    // Total bill
    totalAmount: {
        type: Number,
        required: true
    },

    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'UPI on Delivery'],
        default: 'Cash on Delivery'
    },

    status: {
        type: String,
        enum: ['Received', 'Packed', 'Out for Delivery', 'Completed', 'Cancelled'],
        default: 'Received'
    },

    notes: {
        type: String,
        default: ''
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('orders', OrderSchema);

