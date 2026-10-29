/**
 * 🌱 Veggity Custom User Produce Listing Seeder
 * =========================================================
 * Creates dummy produce listings for any specified user.
 * 
 * Usage:
 *   node seed-user.js --email user@example.com [--count 20] [--clear]
 *   node seed-user.js --id 650000000000000000000000
 *   node seed-user.js --name "User Name"
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

const SAMPLE_LISTINGS = [
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
        title: "Crispy Green Capsicum / Bell Pepper",
        category: "Fruit Vegetables",
        price: 60,
        unit: "kg",
        quantity: 8,
        shelfLifeDays: 4,
        offsetLat: 0.002,
        offsetLng: -0.005,
        locality: "TU Community Garden, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80",
        description: "Crunchy, thick-walled green bell peppers grown inside polyhouse shade net. Juicy and vibrant for stir fry, fried rice, and salads.",
        rating: 4.8,
        ratingCount: 15,
        harvestMethod: "Polyhouse Protected Organic"
    },
    {
        title: "Purple Native Brinjals / Eggplant (Bengena)",
        category: "Fruit Vegetables",
        price: 40,
        unit: "kg",
        quantity: 12,
        shelfLifeDays: 4,
        offsetLat: -0.005,
        offsetLng: 0.008,
        locality: "Napaam Chariali Farm, Tezpur",
        imageUrl: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80",
        description: "Glossy deep violet small round brinjals. Tender flesh with minimal seeds. Perfect for roasting whole for Bengena Pitika.",
        rating: 4.7,
        ratingCount: 21,
        harvestMethod: "Native Seed Backyard Cultivation"
    },
    {
        title: "Fresh Bitter Gourd (Tita Kerela)",
        category: "Other Vegetables",
        price: 45,
        unit: "kg",
        quantity: 6,
        shelfLifeDays: 4,
        offsetLat: 0.007,
        offsetLng: -0.002,
        locality: "Panchmile Bypass, Tezpur",
        imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
        description: "Crisp dark green small bitter gourds. Super healthy, loaded with natural bitters. Great for thin-sliced crispy fries and stir fries.",
        rating: 4.6,
        ratingCount: 13,
        harvestMethod: "Traditional Trellis Garden"
    },
    {
        title: "Crisp White Radish / Daikon (Mula)",
        category: "Root Vegetables",
        price: 30,
        unit: "kg",
        quantity: 16,
        shelfLifeDays: 8,
        offsetLat: -0.009,
        offsetLng: -0.004,
        locality: "Riverbank Alluvial Plot, Borghat",
        imageUrl: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&auto=format&fit=crop&q=80",
        description: "Tender, mildly peppery white radishes with edible green leafy tops. Harvested early morning for optimal juiciness and crunch.",
        rating: 4.7,
        ratingCount: 18,
        harvestMethod: "River Silt Soil Harvest"
    },
    {
        title: "Farm Fresh Green Cabbage (Bandha Kobi)",
        category: "Leafy Vegetables",
        price: 35,
        unit: "piece",
        quantity: 14,
        shelfLifeDays: 2,
        offsetLat: 0.008,
        offsetLng: 0.006,
        locality: "Gate 1 Agro Extension, Tezpur University",
        imageUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&auto=format&fit=crop&q=80",
        description: "Dense, heavy round heads with sweet crispy inner leaves. Grown using compost and zero synthetic pesticides. Very clean and fresh.",
        rating: 4.9,
        ratingCount: 27,
        harvestMethod: "Compost Enriched Farm Beds"
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
        title: "Tender Ridge Gourd (Jhikha)",
        category: "Other Vegetables",
        price: 40,
        unit: "kg",
        quantity: 9,
        shelfLifeDays: 3,
        offsetLat: -0.003,
        offsetLng: 0.007,
        locality: "Napaam South Garden, Tezpur",
        imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&auto=format&fit=crop&q=80",
        description: "Young, slender tender ridge gourds with sweet sponginess when cooked. Ideal for light fish curry or mixed vegetable fry.",
        rating: 4.8,
        ratingCount: 16,
        harvestMethod: "Backyard Vine Harvest"
    }
];

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {
        email: null,
        id: null,
        name: null,
        count: null,
        clear: false
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--email' && args[i + 1]) {
            parsed.email = args[++i];
        } else if (args[i] === '--id' && args[i + 1]) {
            parsed.id = args[++i];
        } else if (args[i] === '--name' && args[i + 1]) {
            parsed.name = args[++i];
        } else if (args[i] === '--count' && args[i + 1]) {
            parsed.count = parseInt(args[++i], 10);
        } else if (args[i] === '--clear') {
            parsed.clear = true;
        }
    }
    return parsed;
}

async function seedListingsForUser() {
    const options = parseArgs();

    if (!options.email && !options.id && !options.name) {
        console.log("==========================================================");
        console.log("🌱 Veggity Seed Listings For Specific User");
        console.log("==========================================================");
        console.log("Please provide an identifier for the user:");
        console.log("  node seed-user.js --email <user_email> [--count 20] [--clear]");
        console.log("  node seed-user.js --id <mongo_user_id>");
        console.log("  node seed-user.js --name \"<user_name>\"");
        console.log("==========================================================");
        process.exit(1);
    }

    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from backend/.env");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✓ Connected to MongoDB Atlas database!");

        // 1. Find user
        let userQuery = {};
        if (options.id) {
            userQuery = { _id: options.id };
        } else if (options.email) {
            userQuery = { email: options.email.toLowerCase().trim() };
        } else if (options.name) {
            userQuery = { name: new RegExp('^' + options.name.trim() + '$', 'i') };
        }

        let user = await UserModel.findOne(userQuery);

        if (!user) {
            console.log(`⚠️ User not found with query:`, userQuery);
            if (options.email) {
                console.log(`Creating user for email: ${options.email}...`);
                user = new UserModel({
                    name: options.name || options.email.split('@')[0],
                    email: options.email.toLowerCase().trim(),
                    password: '$2b$10$dummyhashedpasswordforseedtesting123456789'
                });
                await user.save();
                console.log(`✓ Created user: ${user.name} (${user.email}) - ID: ${user._id}`);
            } else {
                console.error("❌ Cannot create user without email. Please provide --email.");
                await mongoose.disconnect();
                process.exit(1);
            }
        } else {
            console.log(`✓ Found user: "${user.name}" (${user.email}) [ID: ${user._id}]`);
        }

        // 2. Clear existing listings if requested
        if (options.clear) {
            const delRes = await ProductModel.deleteMany({ seller: user._id });
            console.log(`🧹 Cleared ${delRes.deletedCount} existing listings for user.`);
        }

        // 3. Choose number of items (support up to specified count, cycling if needed)
        const count = options.count && options.count > 0 ? options.count : 20;
        const itemsToInsert = [];
        for (let i = 0; i < count; i++) {
            const baseItem = SAMPLE_LISTINGS[i % SAMPLE_LISTINGS.length];
            // Slight jitter if cycling beyond sample length
            const cycleIndex = Math.floor(i / SAMPLE_LISTINGS.length);
            itemsToInsert.push({
                ...baseItem,
                title: cycleIndex > 0 ? `${baseItem.title} (Batch ${cycleIndex + 1})` : baseItem.title,
                offsetLat: baseItem.offsetLat + (cycleIndex * 0.001),
                offsetLng: baseItem.offsetLng + (cycleIndex * 0.001)
            });
        }

        const inserted = [];
        for (const item of itemsToInsert) {
            const itemLat = TEZPUR_UNIVERSITY.lat + (item.offsetLat || 0);
            const itemLng = TEZPUR_UNIVERSITY.lng + (item.offsetLng || 0);
            const expiresAt = new Date(Date.now() + item.shelfLifeDays * 24 * 60 * 60 * 1000);

            const product = new ProductModel({
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
                seller: user._id,
                imageUrl: item.imageUrl,
                description: item.description,
                harvestMethod: item.harvestMethod,
                rating: item.rating,
                ratingCount: item.ratingCount,
                isAvailable: true
            });

            await product.save();
            inserted.push({
                Title: item.title,
                Category: item.category,
                Price: `₹${item.price}/${item.unit}`,
                Stock: `${item.quantity} ${item.unit}`,
                Location: item.locality
            });
        }

        console.log(`\n🎉 Successfully created ${inserted.length} dummy listings for seller "${user.name}"!`);
        console.table(inserted);

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create listings:", err.message);
        if (err.message.includes("Could not connect to any servers")) {
            console.error("\n💡 Note: Make sure your current IP address is whitelisted in your MongoDB Atlas cluster settings (Network Access -> Add IP -> Allow Access From Anywhere / 0.0.0.0/0).");
        }
        process.exit(1);
    }
}

seedListingsForUser();
