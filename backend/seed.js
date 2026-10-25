/**
 * 🌱 Veggity Developer Seed Script
 * =========================================================
 * Location: TEZPUR UNIVERSITY (Napaam, Tezpur, Assam)
 * Coordinates: Latitude 26.7017° N, Longitude 92.8302° E
 * 
 * Generates realistic produce listings with images, descriptions,
 * lister ratings, and accurate GPS offsets within 300m to 4km.
 * =========================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const ProductModel = require('./Models/Product');
const UserModel = require('./Models/User');

const TEZPUR_UNIVERSITY = {
    name: "Tezpur University",
    area: "Napaam, Tezpur, Sonitpur, Assam",
    lat: 26.7017,
    lng: 92.8302
};

const GROWERS = [
    {
        name: "Dr. Biren Saikia (Staff Quarters, TU)",
        email: "biren.saikia@tezu.ac.in",
        phone: "9864012345"
    },
    {
        name: "Dipankar Borah (Napaam Village Garden)",
        email: "dipankar.napaam@veggity.local",
        phone: "9435012346"
    },
    {
        name: "Monika Das (Nilachal Kitchen Garden, TU)",
        email: "monika.das@veggity.local",
        phone: "9706012347"
    },
    {
        name: "Pranjal Kalita (Panchmile Agro Patch)",
        email: "pranjal.kalita@veggity.local",
        phone: "8876012348"
    },
    {
        name: "Sunita Barua (Borghat Road Terrace)",
        email: "sunita.barua@veggity.local",
        phone: "9127012349"
    },
    {
        name: "Hemen Hazarika (Amolapatty Local Farm)",
        email: "hemen.hazarika@veggity.local",
        phone: "9954012350"
    }
];

const PRODUCE_CATALOG = [
    {
        title: "Desi Organic Hybrid Tomatoes (Bilahi)",
        category: "Fruit Vegetables",
        price: 35,
        unit: "kg",
        quantity: 12,
        shelfLifeDays: 3,
        offsetLat: 0.003,
        offsetLng: 0.002,
        locality: "Staff Quarters Block C, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
        description: "Grown naturally on our Staff Quarters terrace garden using neem oil pest control and vermicompost. Naturally ripened on the vine with sweet, juicy flavor.",
        rating: 4.9,
        ratingCount: 22,
        harvestMethod: "100% Chemical-Free Terrace Garden"
    },
    {
        title: "Fresh Palak / Spinach (Paleng Xaak)",
        category: "Leafy Vegetables",
        price: 20,
        unit: "bunch",
        quantity: 15,
        shelfLifeDays: 1,
        offsetLat: -0.004,
        offsetLng: 0.005,
        locality: "Napaam Village, Near Gate 2, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
        description: "Cut fresh early morning from our backyard plot right outside TU Gate 2. Super tender leaves, washed with tube well water. Eat within 24 hours for best flavor!",
        rating: 4.8,
        ratingCount: 16,
        harvestMethod: "Morning Harvest Backyard Garden"
    },
    {
        title: "Assam Coriander (Maan Dhania)",
        category: "Leafy Vegetables",
        price: 15,
        unit: "bunch",
        quantity: 20,
        shelfLifeDays: 2,
        offsetLat: 0.005,
        offsetLng: -0.004,
        locality: "Patkai Hostel Backyard, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80",
        description: "Intensely fragrant indigenous saw-toothed Assam coriander (Maan Dhania). Grown organically by university staff. Essential for traditional fish curry and dal.",
        rating: 5.0,
        ratingCount: 29,
        harvestMethod: "Indigenous Organic Patch"
    },
    {
        title: "Aromatic Terrace Garden Mint (Pudina)",
        category: "Leafy Vegetables",
        price: 12,
        unit: "bunch",
        quantity: 14,
        shelfLifeDays: 2,
        offsetLat: -0.003,
        offsetLng: -0.003,
        locality: "Nilachal Garden, Tezpur University Campus",
        imageUrl: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&auto=format&fit=crop&q=80",
        description: "Very aromatic fresh mint grown in pots with organic soil mix. Great for green chutney, refreshing lemonades, and raita.",
        rating: 4.7,
        ratingCount: 11,
        harvestMethod: "Potted Terrace Garden"
    },
    {
        title: "Fresh Assam Lemon / Kaji Nemu",
        category: "Herbs",
        price: 10,
        unit: "piece",
        quantity: 30,
        shelfLifeDays: 5,
        offsetLat: 0.006,
        offsetLng: 0.003,
        locality: "Dean's Quarter Road, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80",
        description: "Famous GI-tagged Assam Kaji Nemu freshly plucked from our 5-year-old tree. Incomparable aroma and rich juice with high Vitamin C content.",
        rating: 4.9,
        ratingCount: 35,
        harvestMethod: "Home Orchard Tree Harvest"
    },
    {
        title: "Spicy Ghost Pepper & Green Chillies (Bhoot Jolokia)",
        category: "Herbs",
        price: 25,
        unit: "100g",
        quantity: 8,
        shelfLifeDays: 5,
        offsetLat: -0.008,
        offsetLng: 0.012,
        locality: "Panchmile Road, Napaam",
        imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
        description: "Authentic fresh Bhoot Jolokia grown on sandy loam soil in Napaam. Extreme aromatic pungency. Handle with care! Great for pickles and spice lovers.",
        rating: 4.8,
        ratingCount: 19,
        harvestMethod: "Traditional Agro Patch"
    },
    {
        title: "Fresh Curry Leaves (Narasingha Patta)",
        category: "Herbs",
        price: 10,
        unit: "bunch",
        quantity: 18,
        shelfLifeDays: 4,
        offsetLat: 0.002,
        offsetLng: 0.006,
        locality: "Community Hall Area, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
        description: "Dark green, highly aromatic curry leaves from our homegrown tree. Free from any chemical sprays. Plucked on the day of delivery.",
        rating: 4.9,
        ratingCount: 14,
        harvestMethod: "Home Garden Tree Harvest"
    },
    {
        title: "Farm Fresh Cucumbers (Tiyoh)",
        category: "Fruit Vegetables",
        price: 30,
        unit: "kg",
        quantity: 10,
        shelfLifeDays: 4,
        offsetLat: -0.007,
        offsetLng: -0.006,
        locality: "Napaam Tiniali, Tezpur",
        imageUrl: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&auto=format&fit=crop&q=80",
        description: "Crisp, sweet, thin-skinned local cucumbers grown on bamboo trellis. Never bitter, excellent for midday snacks and raw salads.",
        rating: 4.7,
        ratingCount: 18,
        harvestMethod: "Bamboo Trellis Grown"
    },
    {
        title: "Tender Green Okra / Bhindi (Bhendi)",
        category: "Fruit Vegetables",
        price: 45,
        unit: "kg",
        quantity: 7,
        shelfLifeDays: 3,
        offsetLat: 0.011,
        offsetLng: 0.008,
        locality: "Panchmile Chariali, Tezpur",
        imageUrl: "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
        description: "Small, tender bhindi that breaks easily at the tip. Non-slimy when cooked. Harvested every 2 days to maintain peak tenderness.",
        rating: 4.8,
        ratingCount: 20,
        harvestMethod: "Organic Field Grown"
    },
    {
        title: "Local Sweet Red Carrots (Gajor)",
        category: "Root Vegetables",
        price: 50,
        unit: "kg",
        quantity: 14,
        shelfLifeDays: 12,
        offsetLat: 0.014,
        offsetLng: -0.010,
        locality: "Borghat Village, Near Tezpur Bypass",
        imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
        description: "Naturally sweet deep-red Indian carrots grown along the river alluvial soil in Borghat. Crunchy, high sugar content, ideal for carrot halwa or fresh juice.",
        rating: 4.9,
        ratingCount: 31,
        harvestMethod: "River Alluvial Soil Harvest"
    },
    {
        title: "New Harvest Hill Potatoes (Boga Aloo)",
        category: "Root Vegetables",
        price: 28,
        unit: "kg",
        quantity: 25,
        shelfLifeDays: 15,
        offsetLat: -0.012,
        offsetLng: -0.009,
        locality: "Old Napaam Ghat Road",
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
        description: "Freshly dug potatoes with thin skins. Firm texture, doesn't get mushy. Cleaned and dried in the shade for longer shelf life.",
        rating: 4.8,
        ratingCount: 26,
        harvestMethod: "Direct Farm Dig"
    },
    {
        title: "Small Desi Sambar Onions (Piyaj)",
        category: "Bulb Vegetables",
        price: 55,
        unit: "kg",
        quantity: 11,
        shelfLifeDays: 14,
        offsetLat: 0.009,
        offsetLng: 0.011,
        locality: "Panchmile Market, Tezpur",
        imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
        description: "Small shallot-style red onions with strong pungent flavor. Sun-cured for two weeks. Perfect for Indian curries and tadka.",
        rating: 4.6,
        ratingCount: 15,
        harvestMethod: "Sun-Cured Farm Harvest"
    },
    {
        title: "Organic Fresh Garlic Pods (Nohoru)",
        category: "Bulb Vegetables",
        price: 85,
        unit: "500g",
        quantity: 6,
        shelfLifeDays: 15,
        offsetLat: -0.015,
        offsetLng: 0.014,
        locality: "Dolabari Link Road",
        imageUrl: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=80",
        description: "Small tight cloves with purple-tinged skin. Packed with natural garlic oils and allicin. No artificial bleaching or wax coatings.",
        rating: 4.9,
        ratingCount: 24,
        harvestMethod: "100% Unbleached Organic"
    },
    {
        title: "Fresh Mountain Ginger (Aada)",
        category: "Herbs",
        price: 30,
        unit: "250g",
        quantity: 9,
        shelfLifeDays: 5,
        offsetLat: 0.004,
        offsetLng: -0.007,
        locality: "Saraighat Area, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80",
        description: "Juicy, low-fiber young ginger harvested right in Saraighat campus zone. Mild heat, easy to crush for chai, immunity shots, and cooking.",
        rating: 4.9,
        ratingCount: 19,
        harvestMethod: "Shade Grown Campus Garden"
    },
    {
        title: "Tender Bottle Gourd (Jaati Lao)",
        category: "Other Vegetables",
        price: 35,
        unit: "piece",
        quantity: 8,
        shelfLifeDays: 4,
        offsetLat: -0.006,
        offsetLng: 0.004,
        locality: "Napaam Primary School Road",
        imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&auto=format&fit=crop&q=80",
        description: "Light green, tender bottle gourd with soft skin that marks easily with a fingernail. Great for cooling summer curries and dal.",
        rating: 4.8,
        ratingCount: 17,
        harvestMethod: "Backyard Trellis Harvest"
    },
    {
        title: "Garden Sweet Green Peas (Motor Mah)",
        category: "Other Vegetables",
        price: 70,
        unit: "kg",
        quantity: 10,
        shelfLifeDays: 4,
        offsetLat: 0.001,
        offsetLng: -0.002,
        locality: "Staff Quarters Lawn, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80",
        description: "Freshly shelled plump green peas. Sweet enough to eat raw straight from the pod. Grown with zero chemical inputs.",
        rating: 5.0,
        ratingCount: 38,
        harvestMethod: "Campus Community Patch"
    }
];

async function seedTezpurUniversity() {
    try {
        console.log("=================================================");
        console.log("🌱 Veggity Tezpur University Produce Seeder (Rich)");
        console.log("=================================================");

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from backend/.env");
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✓ Connected to MongoDB Atlas database!");

        await ProductModel.createIndexes();

        const growerMap = [];
        for (const g of GROWERS) {
            let user = await UserModel.findOne({ email: g.email });
            if (!user) {
                user = new UserModel({
                    name: g.name,
                    email: g.email,
                    password: '$2b$10$dummyhashedpasswordforseedtesting123456789'
                });
                await user.save();
                console.log(`✓ Registered local grower: ${g.name}`);
            } else {
                console.log(`• Found grower: ${g.name}`);
            }
            growerMap.push(user._id);
        }

        // Clear previous sample listings in Tezpur area to refresh with images and descriptions
        const deleteResult = await ProductModel.deleteMany({
            locationArea: { $regex: /(Tezpur|Napaam|Panchmile|Borghat|Dolabari|Saraighat)/i }
        });
        console.log(`✓ Cleared ${deleteResult.deletedCount} old listings in Tezpur area`);

        const insertedList = [];
        for (let i = 0; i < PRODUCE_CATALOG.length; i++) {
            const item = PRODUCE_CATALOG[i];
            const sellerId = growerMap[i % growerMap.length];

            const itemLat = TEZPUR_UNIVERSITY.lat + item.offsetLat;
            const itemLng = TEZPUR_UNIVERSITY.lng + item.offsetLng;
            const expiresAt = new Date(Date.now() + item.shelfLifeDays * 24 * 60 * 60 * 1000);

            const newProduct = new ProductModel({
                title: item.title,
                category: item.category,
                price: item.price,
                unit: item.unit,
                quantity: item.quantity,
                shelfLifeDays: item.shelfLifeDays,
                expiresAt: expiresAt,
                locationArea: item.locality,
                location: {
                    type: 'Point',
                    coordinates: [itemLng, itemLat]
                },
                seller: sellerId,
                imageUrl: item.imageUrl,
                description: item.description,
                harvestMethod: item.harvestMethod,
                rating: item.rating,
                ratingCount: item.ratingCount,
                isAvailable: true
            });

            await newProduct.save();
            insertedList.push({
                title: item.title,
                category: item.category,
                price: `₹${item.price}/${item.unit}`,
                rating: `⭐ ${item.rating} (${item.ratingCount})`,
                locality: item.locality
            });
        }

        console.log(`\n🎉 Successfully seeded ${insertedList.length} rich produce items near Tezpur University!\n`);
        console.table(insertedList);

        console.log("\n📍 Base Location: Tezpur University Campus (26.7017° N, 92.8302° E)");
        console.log("👉 Now open your browser at http://localhost:5173 - all items will show with images, ratings, and accurate distances!");
        console.log("=================================================\n");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
}

seedTezpurUniversity();
