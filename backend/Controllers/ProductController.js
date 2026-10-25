const ProductModel = require('../Models/Product');
const UserModel = require('../Models/User');

// Helper: Calculate distance between two GPS coordinates in kilometers (Haversine formula)
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round((R * c) * 10) / 10; // e.g. 1.4 km
}

// 1. ADD PRODUCE (Seller lists extra homegrown vegetables)
const addProduct = async (req, res) => {
    try {
        const {
            title,
            category,
            price,
            unit = 'kg',
            quantity,
            shelfLifeDays,
            locationArea,
            latitude,
            longitude,
            imageUrl,
            description,
            harvestMethod
        } = req.body;

        // Validate required fields
        if (!title || !category || !price || !quantity || !shelfLifeDays || !locationArea) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Validate GPS coordinates
        if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
            return res.status(400).json({ success: false, message: 'Accurate location coordinates are required' });
        }

        const latNum = parseFloat(latitude);
        const lngNum = parseFloat(longitude);

        if (isNaN(latNum) || isNaN(lngNum)) {
            return res.status(400).json({ success: false, message: 'Invalid latitude or longitude numbers' });
        }

        // Enforce maximum safety limits based on vegetable biology
        const maxLimits = {
            'Leafy Vegetables': 2,
            'Fruit Vegetables': 4,
            'Root Vegetables': 15,
            'Bulb Vegetables': 15,
            'Herbs': 5,
            'Other Vegetables': 5
        };

        const maxAllowed = maxLimits[category] || 3;
        const requestedDays = Math.max(1, Number(shelfLifeDays));
        const allowedDays = Math.min(requestedDays, maxAllowed);

        // Calculate exact future expiration timestamp
        const expiresAt = new Date(Date.now() + allowedDays * 24 * 60 * 60 * 1000);

        // Create new produce document in MongoDB GeoJSON format [longitude, latitude]
        const newProduct = new ProductModel({
            title: title.trim(),
            category,
            price: Number(price),
            unit: unit || 'kg',
            quantity: Number(quantity),
            shelfLifeDays: allowedDays,
            expiresAt,
            locationArea: locationArea.trim(),
            location: {
                type: 'Point',
                coordinates: [lngNum, latNum] // GeoJSON strictly requires [lng, lat]
            },
            seller: req.user._id, // Extracted safely from decoded JWT token
            imageUrl: imageUrl || '',
            description: (description || '').trim(),
            harvestMethod: harvestMethod || '100% Chemical-Free Homegrown',
            rating: 4.9,
            ratingCount: 1
        });

        // Save to MongoDB
        await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Vegetable listed successfully!',
            product: newProduct
        });
    } catch (err) {
        console.error('Error in addProduct:', err);
        res.status(500).json({ success: false, message: 'Failed to list produce', error: err.message });
    }
};

// 2. GET NEARBY FRESH PRODUCE (Buyer searches for nearby unexpired vegetables)
const getNearbyProducts = async (req, res) => {
    try {
        const { latitude, longitude, radiusKm = 5, category } = req.query;

        // Validate coordinates
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Coordinates are required for nearby search' });
        }

        const latNum = parseFloat(latitude);
        const lngNum = parseFloat(longitude);
        const radiusNum = parseFloat(radiusKm) || 5;

        if (isNaN(latNum) || isNaN(lngNum)) {
            return res.status(400).json({ success: false, message: 'Invalid coordinates provided' });
        }

        // Convert kilometers to meters for MongoDB $maxDistance
        const maxDistanceMeters = radiusNum * 1000;

        // Build query: Must be available, must be unexpired, and must be within radius
        const query = {
            isAvailable: true,
            expiresAt: { $gt: new Date() }, // Freshness filter: only produce with future expiry
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lngNum, latNum]
                    },
                    $maxDistance: maxDistanceMeters
                }
            }
        };

        // Optional category filter
        if (category && category !== 'All' && category !== 'all') {
            query.category = category;
        }

        // Execute query and populate seller's name and email
        const products = await ProductModel.find(query).populate('seller', 'name email');

        // Append distance in km to each product for convenient UI display
        const productsWithDistance = products.map((item) => {
            const doc = item.toObject();
            if (doc.location && doc.location.coordinates) {
                const [itemLng, itemLat] = doc.location.coordinates;
                doc.distanceKm = calculateDistanceKm(latNum, lngNum, itemLat, itemLng);
            } else {
                doc.distanceKm = null;
            }
            return doc;
        });

        res.status(200).json({
            success: true,
            count: productsWithDistance.length,
            radiusKm: radiusNum,
            products: productsWithDistance
        });
    } catch (err) {
        console.error('Error in getNearbyProducts:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch produce', error: err.message });
    }
};

// 3. SEED DUMMY LISTINGS (Creates realistic, diverse listings near any coordinates)
const seedSampleProducts = async (req, res) => {
    try {
        const { latitude, longitude, locationArea } = req.body || {};

        // Default to provided coords or fallback to Delhi NCR
        const baseLat = parseFloat(latitude) || 28.6139;
        const baseLng = parseFloat(longitude) || 77.2090;
        const baseArea = locationArea || 'Neighborhood Garden Area';

        // Find or create dummy grower profiles
        const dummyGrowers = [
            { name: "Ramesh Kumar (Terrace Garden)", email: "ramesh.garden@veggity.local" },
            { name: "Sunita Sharma (Home Patch)", email: "sunita.patch@veggity.local" },
            { name: "Green Acres Organic Farm", email: "greenacres@veggity.local" },
            { name: "Aman Verma (Kitchen Garden)", email: "aman.kitchen@veggity.local" }
        ];

        const growerIds = [];
        for (const g of dummyGrowers) {
            let user = await UserModel.findOne({ email: g.email });
            if (!user) {
                user = new UserModel({
                    name: g.name,
                    email: g.email,
                    password: '$2b$10$dummyhashedpasswordforseedtesting123456789'
                });
                await user.save();
            }
            growerIds.push(user._id);
        }

        // 15 realistic produce items spanning all categories with nearby coordinate jitter (500m to 3.5km away)
        const sampleCatalog = [
            {
                title: "Desi Organic Hybrid Tomatoes",
                category: "Fruit Vegetables",
                price: 32,
                unit: "kg",
                quantity: 10,
                shelfLifeDays: 3,
                offsetLat: 0.005,
                offsetLng: 0.004,
                subArea: "Sector 3"
            },
            {
                title: "Fresh Palak / Farm Spinach",
                category: "Leafy Vegetables",
                price: 20,
                unit: "bunch",
                quantity: 12,
                shelfLifeDays: 1,
                offsetLat: -0.004,
                offsetLng: 0.006,
                subArea: "Garden Block A"
            },
            {
                title: "Country Coriander (Desi Dhaniya)",
                category: "Leafy Vegetables",
                price: 15,
                unit: "bunch",
                quantity: 15,
                shelfLifeDays: 2,
                offsetLat: 0.008,
                offsetLng: -0.005,
                subArea: "West Enclave"
            },
            {
                title: "Aromatic Pudina / Fresh Mint",
                category: "Leafy Vegetables",
                price: 12,
                unit: "bunch",
                quantity: 10,
                shelfLifeDays: 2,
                offsetLat: -0.006,
                offsetLng: -0.007,
                subArea: "Green Street"
            },
            {
                title: "Tender Green Bhindi (Okra)",
                category: "Fruit Vegetables",
                price: 40,
                unit: "kg",
                quantity: 6,
                shelfLifeDays: 3,
                offsetLat: 0.012,
                offsetLng: 0.009,
                subArea: "Temple Road"
            },
            {
                title: "Crisp Farm Cucumbers (Kheera)",
                category: "Fruit Vegetables",
                price: 28,
                unit: "kg",
                quantity: 10,
                shelfLifeDays: 4,
                offsetLat: -0.011,
                offsetLng: 0.003,
                subArea: "Model Town"
            },
            {
                title: "Sweet Organic Red Carrots (Gajar)",
                category: "Root Vegetables",
                price: 45,
                unit: "kg",
                quantity: 14,
                shelfLifeDays: 10,
                offsetLat: 0.015,
                offsetLng: -0.012,
                subArea: "Farm Lane"
            },
            {
                title: "New Harvest Potatoes (Desi Aloo)",
                category: "Root Vegetables",
                price: 26,
                unit: "kg",
                quantity: 20,
                shelfLifeDays: 14,
                offsetLat: -0.018,
                offsetLng: -0.014,
                subArea: "Old Colony"
            },
            {
                title: "Desi Shallot Small Onions",
                category: "Bulb Vegetables",
                price: 55,
                unit: "kg",
                quantity: 9,
                shelfLifeDays: 14,
                offsetLat: 0.007,
                offsetLng: 0.014,
                subArea: "Railway Road"
            },
            {
                title: "Organic Fresh Garlic (Lahsun)",
                category: "Bulb Vegetables",
                price: 80,
                unit: "500g",
                quantity: 5,
                shelfLifeDays: 15,
                offsetLat: -0.009,
                offsetLng: 0.017,
                subArea: "North Colony"
            },
            {
                title: "Fresh Green Chillies (Hari Mirch)",
                category: "Herbs",
                price: 20,
                unit: "250g",
                quantity: 7,
                shelfLifeDays: 5,
                offsetLat: 0.003,
                offsetLng: -0.008,
                subArea: "Bazaar Road"
            },
            {
                title: "Juicy Kagzi Lemons (Desi Nimbu)",
                category: "Herbs",
                price: 35,
                unit: "500g",
                quantity: 8,
                shelfLifeDays: 5,
                offsetLat: -0.005,
                offsetLng: -0.004,
                subArea: "South Extension"
            },
            {
                title: "Aromatic Curry Leaves (Kadi Patta)",
                category: "Herbs",
                price: 10,
                unit: "bunch",
                quantity: 16,
                shelfLifeDays: 4,
                offsetLat: 0.011,
                offsetLng: 0.005,
                subArea: "Main Market"
            },
            {
                title: "Garden Sweet Green Peas (Matar)",
                category: "Other Vegetables",
                price: 65,
                unit: "kg",
                quantity: 11,
                shelfLifeDays: 4,
                offsetLat: -0.014,
                offsetLng: 0.008,
                subArea: "Green Park"
            },
            {
                title: "Crisp Cauliflower (Desi Phool Gobhi)",
                category: "Other Vegetables",
                price: 35,
                unit: "piece",
                quantity: 7,
                shelfLifeDays: 4,
                offsetLat: 0.016,
                offsetLng: -0.018,
                subArea: "Civil Lines"
            }
        ];

        const inserted = [];
        for (let i = 0; i < sampleCatalog.length; i++) {
            const item = sampleCatalog[i];
            const growerId = growerIds[i % growerIds.length];

            const itemLat = baseLat + item.offsetLat;
            const itemLng = baseLng + item.offsetLng;
            const itemExpiresAt = new Date(Date.now() + item.shelfLifeDays * 24 * 60 * 60 * 1000);

            const newProd = new ProductModel({
                title: item.title,
                category: item.category,
                price: item.price,
                unit: item.unit,
                quantity: item.quantity,
                shelfLifeDays: item.shelfLifeDays,
                expiresAt: itemExpiresAt,
                locationArea: `${item.subArea}, ${baseArea}`,
                location: {
                    type: 'Point',
                    coordinates: [itemLng, itemLat] // GeoJSON: [longitude, latitude]
                },
                seller: growerId,
                isAvailable: true
            });

            await newProd.save();
            inserted.push(newProd);
        }

        res.status(201).json({
            success: true,
            message: `Generated ${inserted.length} realistic dummy vegetable listings around ${baseArea}!`,
            count: inserted.length,
            products: inserted
        });
    } catch (err) {
        console.error('Error in seedSampleProducts:', err);
        res.status(500).json({ success: false, message: 'Failed to seed sample products', error: err.message });
    }
};

module.exports = {
    addProduct,
    getNearbyProducts,
    seedSampleProducts
};
