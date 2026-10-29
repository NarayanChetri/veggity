const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/EnsureAuth');
const {
    createOrder,
    getSellerOrders,
    updateOrderStatus,
    getSellerListings,
    deleteSellerListing,
    toggleListingAvailability,
    getBuyerOrders,
    updateSellerListing,
    rateOrder
} = require('../Controllers/OrderController');

// All order actions require user authentication
router.post('/create', ensureAuthenticated, createOrder);
router.get('/seller-orders', ensureAuthenticated, getSellerOrders);
router.get('/my-orders', ensureAuthenticated, getBuyerOrders);
router.put('/:orderId/status', ensureAuthenticated, updateOrderStatus);
router.post('/:orderId/rate', ensureAuthenticated, rateOrder);
router.get('/my-listings', ensureAuthenticated, getSellerListings);
router.put('/my-listings/:productId', ensureAuthenticated, updateSellerListing);
router.delete('/my-listings/:productId', ensureAuthenticated, deleteSellerListing);
router.patch('/my-listings/:productId/toggle', ensureAuthenticated, toggleListingAvailability);

module.exports = router;
