# Project Specification & AI Instruction Prompt: Veggity

> **Prompt for AI Assistant**:  
> You are acting as a senior full-stack MERN developer assisting a beginner developer in building **Veggity** — a hyperlocal marketplace where small farmers, home gardeners, and families with surplus homegrown vegetables can list produce to sell, and nearby neighbors (within a 5km–10km radius) can discover, book, and get it delivered before it perishes.
> 
> Follow the exact architecture, database schemas, coding style, and specifications outlined below. Build one component at a time and explain concepts in clear, beginner-friendly terms.

---

## 1. Project Overview & Current Status

### Tech Stack
* **Database**: MongoDB Atlas (Cloud) with Mongoose ODM
* **Backend**: Node.js & Express.js (Deployed 24/7 on **Render.com**)
* **Frontend**: React + Vite (Deployed on **Vercel** with continuous deployment via GitHub)
* **Styling**: Clean, scoped CSS
* **Authentication**: JWT (`jsonwebtoken`), password hashing with `bcrypt`, input validation with `joi`, and notifications with `react-toastify`.

### What Is Already Built & Working (DO NOT REBUILD)
1. **User Authentication**:
   * `backend/Models/User.js`: User schema (`name`, `email`, `password`).
   * `backend/Controllers/AuthController.js`: `signup` and `login` methods.
   * `backend/Middlewares/AuthValidation.js`: Joi validation for signup/login.
   * `backend/Routes/AuthRouter.js`: Routes `/auth/signup` and `/auth/login`.
   * `frontend/src/pages/Signup.jsx` & `Login.jsx`: Working auth UI storing `token` and `loggedInUser` in `localStorage`.
2. **Infrastructure**:
   * Deployed live: Backend on Render, Frontend on Vercel.
   * Environment variable `VITE_API_URL` dynamically configured in `frontend/src/utils.jsx`.

---

## 2. The Next Goal: Produce Listing & Hyperlocal Discovery Engine

The goal is to allow logged-in growers to list their surplus vegetables with **perishable shelf-life** and **GPS coordinates**, and enable buyers within a **5km–10km radius** to view only fresh, unexpired produce on their Home feed.

---

## 3. The Two Core Business Rules

### Rule 1: Perishable Shelf-Life & Freshness Expiry
Vegetables spoil quickly (leafy greens spoil in 1–2 days, whereas potatoes last 15 days).
* The seller selects a category and shelf-life in days (capped by safety limits).
* The backend calculates:
  $$\text{expiresAt} = \text{Date.now}() + (\text{shelfLifeDays} \times 24 \times 60 \times 60 \times 1000)$$
* The database query **strictly filters out expired items**:
  `expiresAt: { $gt: new Date() }`
* Expired items vanish automatically from the buyer feed without manual intervention.

#### Category Presets & Maximum Limits:
| Category | Examples | Default Shelf-Life | Maximum Allowed Limit |
| :--- | :--- | :--- | :--- |
| `leafy` | Spinach (*Palak*), *Methi*, Coriander, Mint | 1 Day | **2 Days** |
| `soft-veggies` | Tomatoes, Cucumber, Green Beans, Okra | 2 Days | **4 Days** |
| `roots` | Potatoes, Onions, Carrots, Ginger | 7 Days | **15 Days** |
| `herbs` | Lemons, Curry Leaves, Chillies | 3 Days | **5 Days** |

---

### Rule 2: Hyperlocal Proximity Discovery (5km / 10km Range)
Nobody travels 40 km for a small bunch of mint. Discovery must be restricted to neighborhood radius:
* The seller's browser captures GPS coordinates (`latitude`, `longitude`) using the HTML5 Geolocation API.
* MongoDB stores this as a standard **GeoJSON `Point`**:
  `coordinates: [longitude, latitude]` *(Note: Longitude first in GeoJSON)*.
* A **`2dsphere` index** is enabled on the `location` field in MongoDB.
* The buyer feed queries nearby produce using MongoDB's `$near` operator within `$maxDistance` (meters).

---

## 4. Technical Specifications & File Structure

```
Veggity/
├── backend/
│   ├── Controllers/
│   │   ├── AuthController.js        (Existing)
│   │   └── ProductController.js     (NEW - Handles add & nearby query)
│   ├── Middlewares/
│   │   ├── AuthValidation.js       (Existing)
│   │   └── EnsureAuth.js           (NEW - JWT token verification middleware)
│   ├── Models/
│   │   ├── User.js                 (Existing)
│   │   └── Product.js              (NEW - GeoJSON produce schema)
│   ├── Routes/
│   │   ├── AuthRouter.js           (Existing)
│   │   └── ProductRouter.js        (NEW - /products/add & /products/nearby)
│   └── index.js                    (Register ProductRouter)
└── frontend/src/
    ├── pages/
    │   ├── Login.jsx & Signup.jsx  (Existing)
    │   ├── Home.jsx                (UPDATE - Nearby produce cards & radius selector)
    │   └── AddProduce.jsx          (NEW - Seller listing form with GPS detection)
    ├── App.jsx                     (Add route /add-produce)
    └── utils.jsx                   (API_URL helper & Toast utils)
```

---

## 5. Implementation Code Blueprints

### A. Database Model: `backend/Models/Product.js`
```javascript
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: {
        type: String,
        enum: ['leafy', 'soft-veggies', 'roots', 'herbs'],
        required: true
    },
    price: { type: Number, required: true },
    unit: { type: String, default: 'kg' }, // 'kg', 'grams', 'bunch'
    quantity: { type: Number, required: true },
    harvestDate: { type: Date, default: Date.now },
    shelfLifeDays: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    locationArea: { type: String, required: true }, // e.g. "Sector 4, Green Park"
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // CRITICAL: [longitude, latitude]
    },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

// CRITICAL: Geospatial index for distance queries
ProductSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('products', ProductSchema);
```

---

### B. Auth Middleware: `backend/Middlewares/EnsureAuth.js`
```javascript
const jwt = require('jsonwebtoken');

const ensureAuthenticated = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'Unauthorized: Login token missing' });
    }
    try {
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
        req.user = decoded; // Contains user _id and email
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token is invalid or expired' });
    }
};

module.exports = ensureAuthenticated;
```

---

### C. Controller: `backend/Controllers/ProductController.js`
```javascript
const ProductModel = require('../Models/Product');

// 1. ADD PRODUCE (Seller)
const addProduct = async (req, res) => {
    try {
        const { title, category, price, unit, quantity, shelfLifeDays, locationArea, latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'GPS coordinates are required' });
        }

        // Enforce maximum safety limits by category
        const maxLimits = { leafy: 2, 'soft-veggies': 4, roots: 15, herbs: 5 };
        const allowedDays = Math.min(Number(shelfLifeDays), maxLimits[category] || 3);

        // Calculate exact expiration timestamp
        const expiresAt = new Date(Date.now() + allowedDays * 24 * 60 * 60 * 1000);

        const newProduct = new ProductModel({
            title, category, price, unit, quantity,
            shelfLifeDays: allowedDays,
            expiresAt,
            locationArea,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)] // GeoJSON expects [lng, lat]
            },
            seller: req.user._id
        });

        await newProduct.save();
        res.status(201).json({ message: 'Vegetable listed successfully!', product: newProduct });
    } catch (err) {
        res.status(500).json({ message: 'Failed to list produce', error: err.message });
    }
};

// 2. GET NEARBY FRESH PRODUCE (Buyer)
const getNearbyProducts = async (req, res) => {
    try {
        const { latitude, longitude, radiusKm = 5 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const maxDistanceMeters = parseFloat(radiusKm) * 1000;

        const products = await ProductModel.find({
            isAvailable: true,
            expiresAt: { $gt: new Date() }, // Fresh produce only!
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: maxDistanceMeters
                }
            }
        }).populate('seller', 'name email');

        res.status(200).json({ count: products.length, products });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch nearby produce', error: err.message });
    }
};

module.exports = { addProduct, getNearbyProducts };
```

---

### D. Router: `backend/Routes/ProductRouter.js`
```javascript
const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/EnsureAuth');
const { addProduct, getNearbyProducts } = require('../Controllers/ProductController');

router.post('/add', ensureAuthenticated, addProduct);
router.get('/nearby', getNearbyProducts);

module.exports = router;
```

In `backend/index.js`, register:
```javascript
const ProductRouter = require('./Routes/ProductRouter');
app.use('/products', ProductRouter);
```

---

### E. Frontend Seller Form: `frontend/src/pages/AddProduce.jsx`
* **Features**:
  * Automatically detects grower GPS coordinates using `navigator.geolocation.getCurrentPosition()`.
  * Allows selecting Category: `leafy`, `soft-veggies`, `roots`, `herbs`.
  * Dynamic shelf-life dropdown that limits options to the category's maximum limit.
  * Inputs for Title, Price, Unit (`kg`, `grams`, `bunch`), Quantity, Neighborhood Area Name.
  * Submits `POST /products/add` with `Authorization: localStorage.getItem('token')`.

---

### F. Frontend Buyer Feed: `frontend/src/pages/Home.jsx`
* **Features**:
  * Asks for buyer's current location to query nearby vegetables.
  * Dropdown/slider to select radius: **5 km** or **10 km**.
  * Produce Card Grid showing:
    * Vegetable Title & Category Badge.
    * Price per Unit (e.g. ₹30 / kg).
    * Available Quantity.
    * Locality & Seller Name.
    * **Freshness Badge**: Calculated from `expiresAt`:
      ```javascript
      const getFreshnessLabel = (expiresAt) => {
          const diffHours = Math.round((new Date(expiresAt) - new Date()) / (1000 * 60 * 60));
          if (diffHours <= 0) return 'Expired';
          if (diffHours < 24) return `⏰ ${diffHours}h fresh left`;
          return `🌿 ${Math.floor(diffHours / 24)}d fresh remaining`;
      };
      ```
    * "Book / Order" button for next phase.

---

## 6. Critical Developer Pitfalls to Remember
1. **Coordinate Order**: Browser `geolocation` returns `(latitude, longitude)`. MongoDB GeoJSON **requires `[longitude, latitude]`**. Always reverse them when passing to MongoDB!
2. **2dsphere Index**: If MongoDB throws `planner returned error: unable to find index for $geoNear`, ensure `ProductSchema.index({ location: '2dsphere' });` is created.
3. **Environment URLs**: Always import `API_URL` from `../utils` rather than hardcoding `http://localhost:8080`.
4. **Git Workflow**: Code changes pushed to `origin/main` automatically build and deploy to **Render** (backend) and **Vercel** (frontend).
