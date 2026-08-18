"""
Seed Realistic Products and Farmers in Supabase PostgreSQL
Populates the product catalog with authentic agricultural items, realistic farm sources,
proper image references, and active godown inventories.
"""
from decimal import Decimal
import uuid
from app.database.connection import SessionLocal
from app.models.models import (
    User, Farmer, Product, Godown, InventoryItem, ProductLocation
)
from app.core.security import get_password_hash

def seed_realistic_catalog():
    db = SessionLocal()
    try:
        print("[START] Seeding realistic farmers and products...")

        # 1. Fetch or create realistic Farmers
        farms_data = [
            {
                "email": "farmer.greenvalley@maruthamkart.com",
                "name": "Green Valley Farm",
                "phone": "+919840111001",
                "location": "Madurai, Tamil Nadu",
                "farmer_code": "MK-FRM-MAD01",
            },
            {
                "email": "farmer.thanjavur@maruthamkart.com",
                "name": "Thanjavur Delta Farms",
                "phone": "+919840111002",
                "location": "Thanjavur, Tamil Nadu",
                "farmer_code": "MK-FRM-TAN01",
            },
            {
                "email": "farmer.marutham@maruthamkart.com",
                "name": "Marutham Organic Collective",
                "phone": "+919840111003",
                "location": "Dharmapuri, Tamil Nadu",
                "farmer_code": "MK-FRM-DHM01",
            },
            {
                "email": "farmer.srilakshmi@maruthamkart.com",
                "name": "Sri Lakshmi Dairy Farm",
                "phone": "+919840111004",
                "location": "Erode, Tamil Nadu",
                "farmer_code": "MK-FRM-ERD01",
            },
            {
                "email": "farmer.nilgiris@maruthamkart.com",
                "name": "Nilgiri Highlands Produce",
                "phone": "+919840111005",
                "location": "Ooty, Tamil Nadu",
                "farmer_code": "MK-FRM-OOT01",
            },
            {
                "email": "farmer.pollachi@maruthamkart.com",
                "name": "Pollachi Coconut Groves",
                "phone": "+919840111006",
                "location": "Pollachi, Tamil Nadu",
                "farmer_code": "MK-FRM-POL01",
            },
            {
                "email": "farmer.salem@maruthamkart.com",
                "name": "Salem Spice Planters",
                "phone": "+919840111007",
                "location": "Salem, Tamil Nadu",
                "farmer_code": "MK-FRM-SLM01",
            },
            {
                "email": "farmer.kaveri@maruthamkart.com",
                "name": "Kaveri Organic Growers",
                "phone": "+919840111008",
                "location": "Tiruchirappalli, Tamil Nadu",
                "farmer_code": "MK-FRM-TRY01",
            },
        ]

        farmers_map = {}
        for fd in farms_data:
            user = db.query(User).filter(User.email == fd["email"]).first()
            if not user:
                user = User(
                    email=fd["email"],
                    name=fd["name"],
                    phone=fd["phone"],
                    password_hash=get_password_hash("Farmer@123"),
                    role="FARMER",
                    status="Active",
                )
                db.add(user)
                db.flush()

            farmer = db.query(Farmer).filter(Farmer.id == user.id).first()
            if not farmer:
                farmer = Farmer(
                    id=user.id,
                    farmer_code=fd["farmer_code"],
                    location=fd["location"],
                    verified=True,
                    rating=4.9,
                    products_supplied=15,
                )
                db.add(farmer)
                db.flush()
            else:
                farmer.location = fd["location"]
                farmer.verified = True
                farmer.rating = 4.9

            farmers_map[fd["name"]] = farmer

        # Fetch Godowns for inventory mapping
        godowns = db.query(Godown).all()
        if not godowns:
            print("Creating default godown...")
            gd = Godown(
                godown_code="GD-MADURAI-01",
                name="Madurai Central Hub",
                location="Madurai, Tamil Nadu",
                total_capacity=Decimal("10000.00"),
                used_capacity=Decimal("2500.00"),
            )
            db.add(gd)
            db.flush()
            godowns = [gd]

        primary_godown = godowns[0]

        # 2. Comprehensive catalog of realistic products with images
        products_seed = [
            # Fresh Vegetables
            {
                "name": "Country Tomatoes (Nattu Thakkali)",
                "category": "Vegetables",
                "price": Decimal("45.00"),
                "unit": "Kg",
                "available_qty": Decimal("150.00"),
                "rating": 4.9,
                "image_url": "/products/country_tomatoes.jpg",
                "farmer": "Green Valley Farm",
                "description": "Sun-ripened, tangy, and juicy country tomatoes harvested fresh from organic orchards in Madurai. Ideal for rasam, gravies, and salads.",
                "quality_info": "Grade A+, 100% Pesticide-Free, Farm-Direct",
                "harvest_date": "Today Morning",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Fresh Red Bellary Onions",
                "category": "Vegetables",
                "price": Decimal("38.00"),
                "unit": "Kg",
                "available_qty": Decimal("200.00"),
                "rating": 4.8,
                "image_url": "/products/red_onions.jpg",
                "farmer": "Green Valley Farm",
                "description": "Crisp and flavorful red onions freshly cured and sorted for long shelf life. Premium culinary grade.",
                "quality_info": "Medium Size, Dry Outer Skin, Pungent & Fresh",
                "harvest_date": "Yesterday",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Organic Hill Potatoes",
                "category": "Vegetables",
                "price": Decimal("42.00"),
                "unit": "Kg",
                "available_qty": Decimal("180.00"),
                "rating": 4.8,
                "image_url": "/products/fresh_potatoes.jpg",
                "farmer": "Nilgiri Highlands Produce",
                "description": "Farm-fresh mountain potatoes cultivated in cool Nilgiri red soils. Thin skin and rich buttery texture.",
                "quality_info": "Nilgiri Grown, Grade A Table Variety",
                "harvest_date": "2 Days Ago",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Fresh Ooty Carrots",
                "category": "Vegetables",
                "price": Decimal("60.00"),
                "unit": "Kg",
                "available_qty": Decimal("120.00"),
                "rating": 4.9,
                "image_url": "/products/ooty_carrots.jpg",
                "farmer": "Nilgiri Highlands Produce",
                "description": "Crisp, sweet, and deep-orange farm-fresh carrots harvested at peak maturity in Ooty. Packed with vitamin A.",
                "quality_info": "Tender & Crunchy, Nilgiri Farm Fresh",
                "harvest_date": "Today Morning",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Fresh Palak / Spinach (Keerai)",
                "category": "Vegetables",
                "price": Decimal("25.00"),
                "unit": "Bunch",
                "available_qty": Decimal("90.00"),
                "rating": 4.9,
                "image_url": "/products/fresh_spinach.jpg",
                "farmer": "Green Valley Farm",
                "description": "Lush green hydroponic and farm-grown spinach leaves, washed and trimmed for immediate cooking. High in iron and fiber.",
                "quality_info": "Tender Leaves, No Chemical Sprays",
                "harvest_date": "Morning 5:00 AM",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Farm Fresh Green Vegetables Basket",
                "category": "Vegetables",
                "price": Decimal("85.00"),
                "unit": "Kg",
                "available_qty": Decimal("100.00"),
                "rating": 4.9,
                "image_url": "/products/green_vegetables.jpg",
                "farmer": "Kaveri Organic Growers",
                "description": "Assorted basket containing fresh green capsicum, french beans, ladies finger, and cluster beans. Harvested daily.",
                "quality_info": "Certified Farm Fresh, Handpicked",
                "harvest_date": "Today Morning",
                "delivery_estimate": "Same-Day 2 Hours",
            },

            # Rice & Grains
            {
                "name": "Traditional Ponni Boiled Rice",
                "category": "Rice",
                "price": Decimal("65.00"),
                "unit": "Kg",
                "available_qty": Decimal("500.00"),
                "rating": 4.9,
                "image_url": "/products/ponni_rice.jpg",
                "farmer": "Thanjavur Delta Farms",
                "description": "Aged single-origin Ponni rice from the fertile Cauvery Delta. Cooks into fluffy, separate grains with authentic aroma.",
                "quality_info": "1 Year Aged, 100% Kaveri Delta Sourced",
                "harvest_date": "Season Harvest",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "Seeraga Samba Biryani Rice",
                "category": "Rice",
                "price": Decimal("140.00"),
                "unit": "Kg",
                "available_qty": Decimal("250.00"),
                "rating": 5.0,
                "image_url": "/products/seeraga_samba_rice.jpg",
                "farmer": "Kaveri Organic Growers",
                "description": "Exquisite small-grain aromatic Seeraga Samba rice, world famous for authentic Dindigul & Chettinad biryanis.",
                "quality_info": "GI Tagged Variety, Aromatic & Aged",
                "harvest_date": "Season Harvest",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "Organic Sharbati Whole Wheat",
                "category": "Wheat",
                "price": Decimal("52.00"),
                "unit": "Kg",
                "available_qty": Decimal("300.00"),
                "rating": 4.8,
                "image_url": "/products/organic_wheat.jpg",
                "farmer": "Thanjavur Delta Farms",
                "description": "Golden lustrous Sharbati whole wheat grains with high protein content and natural sweetness for rotis.",
                "quality_info": "Organic Certified, High Fiber",
                "harvest_date": "Recent Harvest",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "Stone-Ground Chakki Fresh Atta",
                "category": "Flour",
                "price": Decimal("48.00"),
                "unit": "Kg",
                "available_qty": Decimal("350.00"),
                "rating": 4.9,
                "image_url": "/products/wheat_flour_atta.jpg",
                "farmer": "Thanjavur Delta Farms",
                "description": "Slow-milled 100% whole wheat flour retaining wheat germ and bran. Makes super soft rotis that stay fresh longer.",
                "quality_info": "Zero Maida, 100% Whole Grain",
                "harvest_date": "Milled This Week",
                "delivery_estimate": "Same-Day 2 Hours",
            },

            # Millets
            {
                "name": "Barnyard Millet (Kuthiraivali)",
                "category": "Millets",
                "price": Decimal("120.00"),
                "unit": "Kg",
                "available_qty": Decimal("160.00"),
                "rating": 4.9,
                "image_url": "/products/barnyard_millet.jpg",
                "farmer": "Marutham Organic Collective",
                "description": "Unpolished nutrient-rich Barnyard Millet. Low glycemic index and rich in dietary fiber and iron. Excellent for upma & porridge.",
                "quality_info": "100% Organic, Unpolished Superfood",
                "harvest_date": "Recent Crop",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "Finger Millet / Ragi (Kelvaragu)",
                "category": "Millets",
                "price": Decimal("65.00"),
                "unit": "Kg",
                "available_qty": Decimal("220.00"),
                "rating": 4.9,
                "image_url": "/products/finger_millet_ragi.jpg",
                "farmer": "Marutham Organic Collective",
                "description": "Calcium-rich traditional red ragi grains harvested by Salem tribal farmers. Perfect for ragi kali, porridge, and dosas.",
                "quality_info": "High Calcium, Organic Certified",
                "harvest_date": "Recent Crop",
                "delivery_estimate": "Same-Day 2 Hours",
            },

            # Pulses
            {
                "name": "Premium Organic Toor Dal",
                "category": "Pulses",
                "price": Decimal("165.00"),
                "unit": "Kg",
                "available_qty": Decimal("250.00"),
                "rating": 4.9,
                "image_url": "/products/toor_dal.jpg",
                "farmer": "Kaveri Organic Growers",
                "description": "Unpolished yellow pigeon peas (Toor Dal). Cooks easily to a smooth golden texture with rich protein aroma.",
                "quality_info": "No Oil Polish, High Protein",
                "harvest_date": "Season Harvest",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Unpolished Moong Dal (Green Gram)",
                "category": "Pulses",
                "price": Decimal("135.00"),
                "unit": "Kg",
                "available_qty": Decimal("200.00"),
                "rating": 4.8,
                "image_url": "/products/moong_dal.jpg",
                "farmer": "Kaveri Organic Growers",
                "description": "Easy to digest yellow split moong dal, rich in antioxidants and pure botanical proteins.",
                "quality_info": "Natural Unpolished, Chemical-Free",
                "harvest_date": "Season Harvest",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Organic Kabuli Chana (Chickpeas)",
                "category": "Pulses",
                "price": Decimal("145.00"),
                "unit": "Kg",
                "available_qty": Decimal("180.00"),
                "rating": 4.8,
                "image_url": "/products/chickpeas.jpg",
                "farmer": "Kaveri Organic Growers",
                "description": "Large plump white chickpeas with high nutritional value. Soft melting texture when cooked for curries and sundal.",
                "quality_info": "Jumbo Size, Non-GMO",
                "harvest_date": "Season Harvest",
                "delivery_estimate": "Same-Day 2 Hours",
            },

            # Fresh Fruits
            {
                "name": "Traditional Alphonso Mangoes",
                "category": "Fruits",
                "price": Decimal("180.00"),
                "unit": "Kg",
                "available_qty": Decimal("90.00"),
                "rating": 5.0,
                "image_url": "/products/alphonso_mangoes.jpg",
                "farmer": "Green Valley Farm",
                "description": "Naturally tree-ripened Alphonso mangoes with saffron pulp and rich aromatic sweetness. No carbide ripening.",
                "quality_info": "Tree Ripened, Zero Carbide",
                "harvest_date": "Yesterday Morning",
                "delivery_estimate": "Same-Day Express",
            },
            {
                "name": "Farm Fresh Robusta Bananas",
                "category": "Fruits",
                "price": Decimal("55.00"),
                "unit": "Dozen",
                "available_qty": Decimal("140.00"),
                "rating": 4.9,
                "image_url": "/products/robusta_bananas.jpg",
                "farmer": "Green Valley Farm",
                "description": "Sweet and energetic Robusta bananas grown along the Thamirabarani riverbanks. Perfect daily fruit.",
                "quality_info": "Naturally Matured, Fresh Cut",
                "harvest_date": "Today Morning",
                "delivery_estimate": "Same-Day Express",
            },
            {
                "name": "Premium Shimla Red Apples",
                "category": "Fruits",
                "price": Decimal("190.00"),
                "unit": "Kg",
                "available_qty": Decimal("110.00"),
                "rating": 4.8,
                "image_url": "/products/shimla_apples.jpg",
                "farmer": "Nilgiri Highlands Produce",
                "description": "Crisp, sweet, and juicy Royal Delicious red apples direct from mountain orchards. Natural shine with no wax coating.",
                "quality_info": "Zero Wax Coating, Crisp & Sweet",
                "harvest_date": "3 Days Ago",
                "delivery_estimate": "Same-Day Express",
            },
            {
                "name": "Juicy Nagpur Oranges",
                "category": "Fruits",
                "price": Decimal("95.00"),
                "unit": "Kg",
                "available_qty": Decimal("130.00"),
                "rating": 4.8,
                "image_url": "/products/nagpur_oranges.jpg",
                "farmer": "Nilgiri Highlands Produce",
                "description": "Fresh citrus oranges loaded with refreshing sweet juice and natural Vitamin C. Easy to peel.",
                "quality_info": "Juice Rich, Freshly Plucked",
                "harvest_date": "2 Days Ago",
                "delivery_estimate": "Same-Day Express",
            },
            {
                "name": "Ruby Red Pomegranate (Mathulai)",
                "category": "Fruits",
                "price": Decimal("160.00"),
                "unit": "Kg",
                "available_qty": Decimal("95.00"),
                "rating": 4.9,
                "image_url": "/products/ruby_pomegranate.jpg",
                "farmer": "Green Valley Farm",
                "description": "Grown under tropical sun with deep red sweet pearls. Powerhouse of antioxidants and vitality.",
                "quality_info": "Grade 1 Bhagwa Variety, Soft Seeds",
                "harvest_date": "Yesterday",
                "delivery_estimate": "Same-Day Express",
            },

            # Dairy & Eggs
            {
                "name": "Fresh Farm Cow Milk",
                "category": "Milk",
                "price": Decimal("65.00"),
                "unit": "Litre",
                "available_qty": Decimal("160.00"),
                "rating": 4.9,
                "image_url": "/products/farm_cow_milk.jpg",
                "farmer": "Sri Lakshmi Dairy Farm",
                "description": "Pure unadulterated pasture-fed cow milk chilled immediately after milking. Rich cream layer and natural calcium.",
                "quality_info": "Raw & Fresh Chilled, Tested Zero Antibiotics",
                "harvest_date": "Today 5:30 AM",
                "delivery_estimate": "Morning 6 AM - 8 AM",
            },
            {
                "name": "Free-Range Country Hen Eggs (Nattu Kozhi)",
                "category": "Dairy",
                "price": Decimal("90.00"),
                "unit": "Pack (10)",
                "available_qty": Decimal("120.00"),
                "rating": 4.9,
                "image_url": "/products/farm_fresh_eggs.jpg",
                "farmer": "Sri Lakshmi Dairy Farm",
                "description": "Free-range pasture-raised desi hen eggs with thick natural brown shells and bright golden yolk.",
                "quality_info": "100% Free-Range, Rich Yellow Yolk",
                "harvest_date": "Today Morning",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Fresh Farm Malai Paneer",
                "category": "Dairy",
                "price": Decimal("125.00"),
                "unit": "200g",
                "available_qty": Decimal("80.00"),
                "rating": 4.9,
                "image_url": "/products/fresh_paneer.jpg",
                "farmer": "Sri Lakshmi Dairy Farm",
                "description": "Velvety soft cottage cheese crafted from pure whole cow milk. Melt-in-mouth texture for curries and tikka.",
                "quality_info": "Zero Preservatives, Daily Fresh Batch",
                "harvest_date": "Today 6:00 AM",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Traditional Set Curd (Thayir)",
                "category": "Dairy",
                "price": Decimal("40.00"),
                "unit": "500g",
                "available_qty": Decimal("110.00"),
                "rating": 4.8,
                "image_url": "/products/fresh_curd.jpg",
                "farmer": "Sri Lakshmi Dairy Farm",
                "description": "Thick set curd naturally fermented with traditional active probiotic cultures. Cooling and nourishing.",
                "quality_info": "Active Probiotic, Creamy & Mild",
                "harvest_date": "Fresh Today",
                "delivery_estimate": "Same-Day 2 Hours",
            },

            # Oils & Spices
            {
                "name": "Mara Chekku Groundnut Oil (Cold-Pressed)",
                "category": "Organic",
                "price": Decimal("240.00"),
                "unit": "Litre",
                "available_qty": Decimal("150.00"),
                "rating": 5.0,
                "image_url": "/products/cold_pressed_groundnut_oil.jpg",
                "farmer": "Pollachi Coconut Groves",
                "description": "Wood-pressed raw peanut oil extracted on traditional Vaagai wood chekku below 40°C. Preserves natural vitamins.",
                "quality_info": "Zero Chemical Refining, 100% Cold Pressed",
                "harvest_date": "This Week Batch",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "Virgin Cold-Pressed Coconut Oil",
                "category": "Organic",
                "price": Decimal("260.00"),
                "unit": "Litre",
                "available_qty": Decimal("140.00"),
                "rating": 5.0,
                "image_url": "/products/pure_coconut_oil.jpg",
                "farmer": "Pollachi Coconut Groves",
                "description": "Extracted from sun-dried sulfur-free copra of Pollachi coconuts. Rich pleasant aroma and high lauric acid.",
                "quality_info": "Sulfur-Free Copra, Wood Cold-Pressed",
                "harvest_date": "Fresh Extraction",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "Pollachi Fresh Coconuts (Thengai)",
                "category": "Vegetables",
                "price": Decimal("45.00"),
                "unit": "Piece",
                "available_qty": Decimal("200.00"),
                "rating": 4.9,
                "image_url": "/products/fresh_coconut.jpg",
                "farmer": "Pollachi Coconut Groves",
                "description": "Large, thick-kernel coconuts with sweet water harvested from Pollachi groves. Ideal for daily chutney and cooking.",
                "quality_info": "Thick White Kernel, Sweet Water",
                "harvest_date": "Harvested Yesterday",
                "delivery_estimate": "Same-Day 2 Hours",
            },
            {
                "name": "Salem Fresh High-Curcumin Turmeric",
                "category": "Organic",
                "price": Decimal("95.00"),
                "unit": "Kg",
                "available_qty": Decimal("120.00"),
                "rating": 4.9,
                "image_url": "/products/salem_turmeric.jpg",
                "farmer": "Salem Spice Planters",
                "description": "Raw unpolished Salem turmeric rhizomes rich in natural curcumin. Powerful natural anti-inflammatory spice.",
                "quality_info": "High 5.5% Curcumin, Salem Heritage",
                "harvest_date": "Fresh Harvest",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "Traditional Palm Jaggery (Karupatti)",
                "category": "Organic",
                "price": Decimal("280.00"),
                "unit": "Kg",
                "available_qty": Decimal("110.00"),
                "rating": 5.0,
                "image_url": "/products/organic_palm_jaggery.jpg",
                "farmer": "Marutham Organic Collective",
                "description": "Handcrafted pure Palm Jaggery made from unfermented Palmyra palm sap. Iron-rich natural sweetener.",
                "quality_info": "100% Pure Karupatti, Zero Sugar Adulteration",
                "harvest_date": "Traditional Batch",
                "delivery_estimate": "Next-Day Guaranteed",
            },
            {
                "name": "100% Raw Forest Honey (Then)",
                "category": "Organic",
                "price": Decimal("390.00"),
                "unit": "500g",
                "available_qty": Decimal("75.00"),
                "rating": 5.0,
                "image_url": "/products/raw_forest_honey.jpg",
                "farmer": "Marutham Organic Collective",
                "description": "Wild multifloral raw honey sustainably harvested by tribal beekeepers from mountain flora. Unheated and unfiltered.",
                "quality_info": "Unprocessed Wild Honey, Raw & Natural",
                "harvest_date": "Wild Extraction",
                "delivery_estimate": "Next-Day Guaranteed",
            },
        ]

        count = 0
        for item in products_seed:
            farmer_obj = farmers_map.get(item["farmer"])
            if not farmer_obj:
                farmer_obj = list(farmers_map.values())[0]

            # Check if product already exists by name
            existing = db.query(Product).filter(Product.name == item["name"]).first()
            if existing:
                existing.category = item["category"]
                existing.price = item["price"]
                existing.unit = item["unit"]
                existing.available_qty = item["available_qty"]
                existing.availability = "Available"
                existing.status = "Active"
                existing.rating = item["rating"]
                existing.image_url = item["image_url"]
                existing.farmer_id = farmer_obj.id
                existing.description = item["description"]
                existing.quality_info = item["quality_info"]
                existing.harvest_date = item["harvest_date"]
                existing.delivery_estimate = item["delivery_estimate"]
                prod = existing
            else:
                prod = Product(
                    name=item["name"],
                    category=item["category"],
                    price=item["price"],
                    unit=item["unit"],
                    available_qty=item["available_qty"],
                    availability="Available",
                    status="Active",
                    rating=item["rating"],
                    image_url=item["image_url"],
                    farmer_id=farmer_obj.id,
                    description=item["description"],
                    quality_info=item["quality_info"],
                    harvest_date=item["harvest_date"],
                    delivery_estimate=item["delivery_estimate"],
                )
                db.add(prod)
                db.flush()

            count += 1

        db.commit()
        print(f"[SUCCESS] Successfully seeded/updated {count} realistic products across all categories!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding catalog: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_realistic_catalog()
