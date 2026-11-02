import json
import urllib.request
import urllib.error
import time
import sys

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://veggity-backend.onrender.com"
EMAIL = "admin@gmail.com"
PASSWORD = "admin"

TEZPUR_UNIVERSITY = {
    "name": "Tezpur University",
    "area": "Napaam, Tezpur, Sonitpur, Assam",
    "lat": 26.7017,
    "lng": 92.8302
}

SAMPLE_LISTINGS = [
    {
        "title": "Desi Organic Hybrid Tomatoes (Bilahi)",
        "category": "Fruit Vegetables",
        "price": 35,
        "unit": "kg",
        "quantity": 12,
        "shelfLifeDays": 3,
        "offsetLat": 0.003,
        "offsetLng": 0.002,
        "locality": "Staff Quarters Block C, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
        "description": "Grown naturally on our Staff Quarters terrace garden using neem oil pest control and vermicompost. Naturally ripened on the vine with sweet, juicy flavor.",
        "harvestMethod": "100% Chemical-Free Terrace Garden"
    },
    {
        "title": "Fresh Palak / Spinach (Paleng Xaak)",
        "category": "Leafy Vegetables",
        "price": 20,
        "unit": "bunch",
        "quantity": 15,
        "shelfLifeDays": 1,
        "offsetLat": -0.004,
        "offsetLng": 0.005,
        "locality": "Napaam Village, Near Gate 2, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=80",
        "description": "Cut fresh early morning from our backyard plot right outside TU Gate 2. Super tender leaves, washed with tube well water. Eat within 24 hours for best flavor!",
        "harvestMethod": "Morning Harvest Backyard Garden"
    },
    {
        "title": "Assam Coriander (Maan Dhania)",
        "category": "Leafy Vegetables",
        "price": 15,
        "unit": "bunch",
        "quantity": 20,
        "shelfLifeDays": 2,
        "offsetLat": 0.005,
        "offsetLng": -0.004,
        "locality": "Patkai Hostel Backyard, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80",
        "description": "Intensely fragrant indigenous saw-toothed Assam coriander (Maan Dhania). Grown organically by university staff. Essential for traditional fish curry and dal.",
        "harvestMethod": "Indigenous Organic Patch"
    },
    {
        "title": "Aromatic Terrace Garden Mint (Pudina)",
        "category": "Leafy Vegetables",
        "price": 12,
        "unit": "bunch",
        "quantity": 14,
        "shelfLifeDays": 2,
        "offsetLat": -0.003,
        "offsetLng": -0.003,
        "locality": "Nilachal Garden, Tezpur University Campus",
        "imageUrl": "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&auto=format&fit=crop&q=80",
        "description": "Very aromatic fresh mint grown in pots with organic soil mix. Great for green chutney, refreshing lemonades, and raita.",
        "harvestMethod": "Potted Terrace Garden"
    },
    {
        "title": "Fresh Assam Lemon / Kaji Nemu",
        "category": "Herbs",
        "price": 10,
        "unit": "piece",
        "quantity": 30,
        "shelfLifeDays": 5,
        "offsetLat": 0.006,
        "offsetLng": 0.003,
        "locality": "Dean's Quarter Road, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&auto=format&fit=crop&q=80",
        "description": "Famous GI-tagged Assam Kaji Nemu freshly plucked from our 5-year-old tree. Incomparable aroma and rich juice with high Vitamin C content.",
        "harvestMethod": "Home Orchard Tree Harvest"
    },
    {
        "title": "Spicy Ghost Pepper & Green Chillies (Bhoot Jolokia)",
        "category": "Herbs",
        "price": 25,
        "unit": "100g",
        "quantity": 8,
        "shelfLifeDays": 5,
        "offsetLat": -0.008,
        "offsetLng": 0.012,
        "locality": "Panchmile Road, Napaam",
        "imageUrl": "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
        "description": "Authentic fresh Bhoot Jolokia grown on sandy loam soil in Napaam. Extreme aromatic pungency. Handle with care! Great for pickles and spice lovers.",
        "harvestMethod": "Traditional Agro Patch"
    },
    {
        "title": "Farm Fresh Cucumbers (Tiyoh)",
        "category": "Fruit Vegetables",
        "price": 30,
        "unit": "kg",
        "quantity": 10,
        "shelfLifeDays": 4,
        "offsetLat": -0.007,
        "offsetLng": -0.006,
        "locality": "Napaam Tiniali, Tezpur",
        "imageUrl": "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&auto=format&fit=crop&q=80",
        "description": "Crisp, sweet, thin-skinned local cucumbers grown on bamboo trellis. Never bitter, excellent for midday snacks and raw salads.",
        "harvestMethod": "Bamboo Trellis Grown"
    },
    {
        "title": "Tender Green Okra / Bhindi (Bhendi)",
        "category": "Fruit Vegetables",
        "price": 45,
        "unit": "kg",
        "quantity": 7,
        "shelfLifeDays": 3,
        "offsetLat": 0.011,
        "offsetLng": 0.008,
        "locality": "Panchmile Chariali, Tezpur",
        "imageUrl": "https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=80",
        "description": "Small, tender bhindi that breaks easily at the tip. Non-slimy when cooked. Harvested every 2 days to maintain peak tenderness.",
        "harvestMethod": "Organic Field Grown"
    },
    {
        "title": "Local Sweet Red Carrots (Gajor)",
        "category": "Root Vegetables",
        "price": 50,
        "unit": "kg",
        "quantity": 14,
        "shelfLifeDays": 12,
        "offsetLat": 0.014,
        "offsetLng": -0.010,
        "locality": "Borghat Village, Near Tezpur Bypass",
        "imageUrl": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
        "description": "Naturally sweet deep-red Indian carrots grown along the river alluvial soil in Borghat. Crunchy, high sugar content, ideal for carrot halwa or fresh juice.",
        "harvestMethod": "River Alluvial Soil Harvest"
    },
    {
        "title": "New Harvest Hill Potatoes (Boga Aloo)",
        "category": "Root Vegetables",
        "price": 28,
        "unit": "kg",
        "quantity": 25,
        "shelfLifeDays": 15,
        "offsetLat": -0.012,
        "offsetLng": -0.009,
        "locality": "Old Napaam Ghat Road",
        "imageUrl": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
        "description": "Freshly dug potatoes with thin skins. Firm texture, doesn't get mushy. Cleaned and dried in the shade for longer shelf life.",
        "harvestMethod": "Direct Farm Dig"
    },
    {
        "title": "Small Desi Sambar Onions (Piyaj)",
        "category": "Bulb Vegetables",
        "price": 55,
        "unit": "kg",
        "quantity": 11,
        "shelfLifeDays": 14,
        "offsetLat": 0.009,
        "offsetLng": 0.011,
        "locality": "Panchmile Market, Tezpur",
        "imageUrl": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
        "description": "Small shallot-style red onions with strong pungent flavor. Sun-cured for two weeks. Perfect for Indian curries and tadka.",
        "harvestMethod": "Sun-Cured Farm Harvest"
    },
    {
        "title": "Garden Sweet Green Peas (Motor Mah)",
        "category": "Other Vegetables",
        "price": 70,
        "unit": "kg",
        "quantity": 10,
        "shelfLifeDays": 4,
        "offsetLat": 0.001,
        "offsetLng": -0.002,
        "locality": "Staff Quarters Lawn, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&auto=format&fit=crop&q=80",
        "description": "Freshly shelled plump green peas. Sweet enough to eat raw straight from the pod. Grown with zero chemical inputs.",
        "harvestMethod": "Campus Community Patch"
    },
    {
        "title": "Organic Fresh Garlic Pods (Nohoru)",
        "category": "Bulb Vegetables",
        "price": 85,
        "unit": "500g",
        "quantity": 6,
        "shelfLifeDays": 15,
        "offsetLat": -0.015,
        "offsetLng": 0.014,
        "locality": "Dolabari Link Road",
        "imageUrl": "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=80",
        "description": "Small tight cloves with purple-tinged skin. Packed with natural garlic oils and allicin. No artificial bleaching or wax coatings.",
        "harvestMethod": "100% Unbleached Organic"
    },
    {
        "title": "Fresh Mountain Ginger (Aada)",
        "category": "Herbs",
        "price": 30,
        "unit": "250g",
        "quantity": 9,
        "shelfLifeDays": 5,
        "offsetLat": 0.004,
        "offsetLng": -0.007,
        "locality": "Saraighat Area, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=80",
        "description": "Juicy, low-fiber young ginger harvested right in Saraighat campus zone. Mild heat, easy to crush for chai, immunity shots, and cooking.",
        "harvestMethod": "Shade Grown Campus Garden"
    },
    {
        "title": "Tender Bottle Gourd (Jaati Lao)",
        "category": "Other Vegetables",
        "price": 35,
        "unit": "piece",
        "quantity": 8,
        "shelfLifeDays": 4,
        "offsetLat": -0.006,
        "offsetLng": 0.004,
        "locality": "Napaam Primary School Road",
        "imageUrl": "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&auto=format&fit=crop&q=80",
        "description": "Light green, tender bottle gourd with soft skin that marks easily with a fingernail. Great for cooling summer curries and dal.",
        "harvestMethod": "Backyard Trellis Harvest"
    },
    {
        "title": "Crispy Green Capsicum / Bell Pepper",
        "category": "Fruit Vegetables",
        "price": 60,
        "unit": "kg",
        "quantity": 8,
        "shelfLifeDays": 4,
        "offsetLat": 0.002,
        "offsetLng": -0.005,
        "locality": "TU Community Garden, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80",
        "description": "Crunchy, thick-walled green bell peppers grown inside polyhouse shade net. Juicy and vibrant for stir fry, fried rice, and salads.",
        "harvestMethod": "Polyhouse Protected Organic"
    },
    {
        "title": "Purple Native Brinjals / Eggplant (Bengena)",
        "category": "Fruit Vegetables",
        "price": 40,
        "unit": "kg",
        "quantity": 12,
        "shelfLifeDays": 4,
        "offsetLat": -0.005,
        "offsetLng": 0.008,
        "locality": "Napaam Chariali Farm, Tezpur",
        "imageUrl": "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80",
        "description": "Glossy deep violet small round brinjals. Tender flesh with minimal seeds. Perfect for roasting whole for Bengena Pitika.",
        "harvestMethod": "Native Seed Backyard Cultivation"
    },
    {
        "title": "Fresh Bitter Gourd (Tita Kerela)",
        "category": "Other Vegetables",
        "price": 45,
        "unit": "kg",
        "quantity": 6,
        "shelfLifeDays": 4,
        "offsetLat": 0.007,
        "offsetLng": -0.002,
        "locality": "Panchmile Bypass, Tezpur",
        "imageUrl": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
        "description": "Crisp dark green small bitter gourds. Super healthy, loaded with natural bitters. Great for thin-sliced crispy fries and stir fries.",
        "harvestMethod": "Traditional Trellis Garden"
    },
    {
        "title": "Crisp White Radish / Daikon (Mula)",
        "category": "Root Vegetables",
        "price": 30,
        "unit": "kg",
        "quantity": 16,
        "shelfLifeDays": 8,
        "offsetLat": -0.009,
        "offsetLng": -0.004,
        "locality": "Riverbank Alluvial Plot, Borghat",
        "imageUrl": "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&auto=format&fit=crop&q=80",
        "description": "Tender, mildly peppery white radishes with edible green leafy tops. Harvested early morning for optimal juiciness and crunch.",
        "harvestMethod": "River Silt Soil Harvest"
    },
    {
        "title": "Farm Fresh Green Cabbage (Bandha Kobi)",
        "category": "Leafy Vegetables",
        "price": 35,
        "unit": "piece",
        "quantity": 14,
        "shelfLifeDays": 2,
        "offsetLat": 0.008,
        "offsetLng": 0.006,
        "locality": "Gate 1 Agro Extension, Tezpur University",
        "imageUrl": "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=600&auto=format&fit=crop&q=80",
        "description": "Dense, heavy round heads with sweet crispy inner leaves. Grown using compost and zero synthetic pesticides. Very clean and fresh.",
        "harvestMethod": "Compost Enriched Farm Beds"
    }
]

def deploy_dummy_listings():
    print("=" * 60)
    print(f"🌱 Veggity Dummy Data Deployment for {EMAIL}")
    print(f"🌐 Target Live Backend: {BASE_URL}")
    print("=" * 60)

    # 1. Login to obtain valid JWT token
    print("\n1. Authenticating as admin...")
    login_payload = json.dumps({"email": EMAIL, "password": PASSWORD}).encode("utf-8")
    req_login = urllib.request.Request(
        f"{BASE_URL}/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req_login, timeout=15) as res:
            auth_data = json.loads(res.read().decode())
            token = auth_data["jwtToken"]
            user_name = auth_data.get("name", "admin")
            print(f"✓ Authentication successful! Logged in as: {user_name} ({EMAIL})")
    except Exception as e:
        print(f"❌ Failed to login as {EMAIL}: {e}")
        return

    # 2. Deploy all sample listings
    print(f"\n2. Deploying {len(SAMPLE_LISTINGS)} sample listings to live database...")
    success_count = 0
    errors = []

    for idx, item in enumerate(SAMPLE_LISTINGS, start=1):
        item_lat = TEZPUR_UNIVERSITY["lat"] + item.get("offsetLat", 0.0)
        item_lng = TEZPUR_UNIVERSITY["lng"] + item.get("offsetLng", 0.0)

        payload = {
            "title": item["title"],
            "category": item["category"],
            "price": item["price"],
            "unit": item["unit"],
            "quantity": item["quantity"],
            "shelfLifeDays": item["shelfLifeDays"],
            "locationArea": item["locality"],
            "latitude": round(item_lat, 6),
            "longitude": round(item_lng, 6),
            "imageUrl": item["imageUrl"],
            "description": item["description"],
            "harvestMethod": item["harvestMethod"]
        }

        req_add = urllib.request.Request(
            f"{BASE_URL}/products/add",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": token
            }
        )

        try:
            with urllib.request.urlopen(req_add, timeout=15) as res:
                res_data = json.loads(res.read().decode())
                if res_data.get("success"):
                    success_count += 1
                    print(f"  [{idx:02d}/{len(SAMPLE_LISTINGS)}] ✓ Listed: {item['title']} (₹{item['price']}/{item['unit']})")
                else:
                    errors.append((item['title'], res_data.get("message")))
                    print(f"  [{idx:02d}/{len(SAMPLE_LISTINGS)}] ⚠️ {item['title']}: {res_data.get('message')}")
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode()
            errors.append((item['title'], err_msg))
            print(f"  [{idx:02d}/{len(SAMPLE_LISTINGS)}] ❌ HTTP {e.code}: {err_msg}")
        except Exception as e:
            errors.append((item['title'], str(e)))
            print(f"  [{idx:02d}/{len(SAMPLE_LISTINGS)}] ❌ Error: {e}")

        # Tiny delay to avoid rate limiting
        time.sleep(0.3)

    print("\n" + "=" * 60)
    print(f"🎉 Deployment Complete! Successfully deployed {success_count}/{len(SAMPLE_LISTINGS)} produce listings.")
    print("=" * 60)

    # 3. Verify proximity query on live backend
    print("\n3. Verifying listings on live /products/nearby endpoint...")
    query_url = f"{BASE_URL}/products/nearby?lat={TEZPUR_UNIVERSITY['lat']}&lng={TEZPUR_UNIVERSITY['lng']}&radiusKm=20"
    try:
        with urllib.request.urlopen(query_url, timeout=15) as res:
            nearby_data = json.loads(res.read().decode())
            live_prods = nearby_data.get("products", [])
            print(f"✓ Live nearby search returned {len(live_prods)} fresh products within 20km!")
    except Exception as e:
        print(f"⚠️ Could not verify nearby search: {e}")

if __name__ == "__main__":
    deploy_dummy_listings()
