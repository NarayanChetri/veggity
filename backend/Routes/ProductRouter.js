const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/EnsureAuth');
const { addProduct, getNearbyProducts, seedSampleProducts } = require('../Controllers/ProductController');

// 1. POST /products/add -> Protected by authentication (only logged-in sellers can list produce)
router.post('/add', ensureAuthenticated, addProduct);

// 2. GET /products/nearby -> Public search (any neighbor can search for fresh produce)
router.get('/nearby', getNearbyProducts);

// 3. POST /products/seed-sample -> Creates 15 realistic sample produce listings around the requested area
router.post('/seed-sample', seedSampleProducts);

module.exports = router;
