const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/EnsureAuth');
const {
    createOrder,
    getSellerOrders,
    updateOrderStatus,
    getSellerListings,
    deleteSellerListing,
    getBuyerOrders
} = require('../Controllers/OrderController');

// All order actions require user authentication
router.post('/create', ensureAuthenticated, createOrder);
router.get('/seller-orders', ensureAuthenticated, getSellerOrders);
router.get('/my-orders', ensureAuthenticated, getBuyerOrders);
router.put('/:orderId/status', ensureAuthenticated, updateOrderStatus);
router.get('/my-listings', ensureAuthenticated, getSellerListings);
router.delete('/my-listings/:productId', ensureAuthenticated, deleteSellerListing);

module.exports = router;
