import os
import uuid
from PIL import Image, ImageDraw, ImageFont
from app.database.connection import SessionLocal
from app.models.models import User, Farmer, Godown, Product

def create_product_images():
    output_dir = r"..\public\products"
    os.makedirs(output_dir, exist_ok=True)

    products_spec = [
        ("ponni_rice", "🌾", "Ponni Raw & Boiled Rice", "#E8F5E9", "#1B5E20", "#388E3C"),
        ("organic_wheat", "🌾", "Organic Whole Wheat Grain", "#FFF8E1", "#E65100", "#F57C00"),
        ("wheat_flour", "🥡", "Chakki Fresh Atta Flour", "#FFF3E0", "#BF360C", "#D84315"),
        ("country_tomatoes", "🍅", "Farm Fresh Country Tomatoes", "#FFEBEE", "#B71C1C", "#D32F2F"),
        ("farm_cow_milk", "🥛", "Pure Farm Fresh A2 Milk", "#E1F5FE", "#01579B", "#0288D1"),
        ("barnyard_millet", "🌿", "Kuthiraivali Barnyard Millet", "#F1F8E9", "#33691E", "#558B2F"),
        ("finger_millet_ragi", "🌰", "Organic Ragi / Finger Millet", "#EFEBE9", "#3E2723", "#4E342E"),
        ("yellow_corn", "🌽", "Fresh Sweet Corn Maize", "#FFFDE7", "#F57F17", "#FBC02D"),
        ("toor_dal", "🫘", "Unpolished Native Toor Dal", "#FFFDE7", "#E65100", "#FB8C00"),
        ("chickpeas", "🧆", "Organic Country Chana", "#EFEBE9", "#4E342E", "#6D4C41"),
        ("groundnut", "🥜", "Fresh Native Groundnuts", "#EFEBE9", "#3E2723", "#5D4037"),
        ("green_vegetables", "🥦", "Farm Fresh Spinach & Greens", "#E8F5E9", "#1B5E20", "#2E7D32"),
        ("red_onions", "🧅", "Organic Small & Red Onions", "#FCE4EC", "#880E4F", "#C2185B"),
        ("cold_pressed_oil", "🫒", "Wood Pressed Groundnut Oil", "#FFF8E1", "#F57F17", "#FFA000"),
        ("fresh_turmeric", "🌿", "Organic Erode Turmeric Root", "#FFFDE7", "#E65100", "#F57F17"),
        ("alphonso_mangoes", "🥭", "Salem Farm Fresh Mangoes", "#FFF8E1", "#E65100", "#FB8C00"),
    ]

    size = (600, 600)
    for slug, emoji, title, bg_color, text_color, badge_color in products_spec:
        img = Image.new("RGBA", size, color=bg_color)
        draw = ImageDraw.Draw(img)

        # Decorative inner container
        draw.ellipse([70, 70, 530, 530], outline=badge_color, width=4)
        draw.ellipse([90, 90, 510, 510], fill="#FFFFFF")

        # Top tag
        draw.rounded_rectangle([180, 115, 420, 155], radius=15, fill=badge_color)
        draw.text((220, 125), "FARM FRESH", fill="#FFFFFF")

        # Title text
        draw.text((150, 430), title[:24], fill=text_color)
        draw.text((200, 465), "100% Direct Harvest", fill=badge_color)

        # Border
        draw.rectangle([0, 0, 599, 599], outline=badge_color, width=6)

        out_path = os.path.join(output_dir, f"{slug}.png")
        img.save(out_path, "PNG")

    print(f"Generated {len(products_spec)} product graphics in {output_dir}")

def seed_products_in_db():
    db = SessionLocal()
    try:
        # Ensure Godowns exist
        godown = db.query(Godown).first()
        if not godown:
            godown = Godown(
                name="Coimbatore Central Godown",
                godown_code=f"GD-CBE-01",
                location="Coimbatore",
                total_capacity=500000.0,
                used_capacity=12000.0,
            )
            db.add(godown)
            db.commit()
            db.refresh(godown)

        # Ensure Farmer exists
        farmer_user = db.query(User).filter(User.role == "FARMER").first()
        if not farmer_user:
            farmer_user = User(
                email="farmer.velusamy@maruthamkart.com",
                name="Velusamy Farmstead",
                phone="+919842100001",
                role="FARMER",
                status="Active",
                password_hash="$2b$12$eX8mE/XzH7wQz.N1cZ1aOeYq7dFk2l9g6mP3uX5yV0bE1r2s3t4u5",
            )
            db.add(farmer_user)
            db.commit()
            db.refresh(farmer_user)

        farmer_profile = db.query(Farmer).filter(Farmer.id == farmer_user.id).first()
        if not farmer_profile:
            farmer_profile = Farmer(
                id=farmer_user.id,
                farm_name="Marutham Natural Organic Farms",
                farm_location="Thondamuthur, Coimbatore",
                acres=12.5,
                organic_certified=True,
            )
            db.add(farmer_profile)
            db.commit()

        # Define 16 high quality authentic agricultural products
        catalog = [
            ("Traditional Ponni Raw Rice", "Rice", 68.0, "Kg", "Naturally farmed Ponni rice from Cauvery delta basin.", "/products/ponni_rice.png", 4.9, 450),
            ("Organic Whole Wheat Grain", "Wheat", 54.0, "Kg", "Unpolished whole grain golden wheat with high fiber.", "/products/organic_wheat.png", 4.8, 300),
            ("Chakki Fresh Stone Ground Atta", "Flour", 62.0, "Kg", "Traditional stone-ground 100% whole wheat flour.", "/products/wheat_flour.png", 4.9, 200),
            ("Country Tomatoes (Nattu Thakkali)", "Vegetables", 34.0, "Kg", "Tangy, juicy country tomatoes hand-picked daily.", "/products/country_tomatoes.png", 4.7, 180),
            ("Pure Farm Fresh Cow Milk", "Milk", 38.0, "Litre", "A2 country cow milk, unadulterated & cold pasteurized.", "/products/farm_cow_milk.png", 4.9, 120),
            ("Barnyard Millet (Kuthiraivali)", "Organic", 85.0, "Kg", "Gluten-free traditional South Indian barnyard millet.", "/products/barnyard_millet.png", 4.8, 150),
            ("Organic Finger Millet (Ragi)", "Organic", 58.0, "Kg", "Calcium-rich dark finger millet directly from drylands.", "/products/finger_millet_ragi.png", 4.9, 220),
            ("Sweet Corn / Farm Fresh Maize", "Vegetables", 28.0, "Piece", "Tender, juicy yellow corn harvested this morning.", "/products/yellow_corn.png", 4.6, 250),
            ("Unpolished Native Toor Dal", "Pulses", 145.0, "Kg", "Native country toor dal, enzyme-rich and chemical free.", "/products/toor_dal.png", 4.9, 160),
            ("Country Brown Chana / Chickpeas", "Pulses", 98.0, "Kg", "High-protein unpolished brown chickpeas.", "/products/chickpeas.png", 4.8, 190),
            ("Fresh Native Raw Groundnuts", "Pulses", 88.0, "Kg", "Crunchy country groundnuts from Pollachi red soil.", "/products/groundnut.png", 4.8, 210),
            ("Farm Fresh Spinach & Green Keerai", "Vegetables", 22.0, "Bunch", "Organic Palak, Siru Keerai, and Arai Keerai freshly cut.", "/products/green_vegetables.png", 4.9, 100),
            ("Country Small Red Onions (Chinna Vengayam)", "Vegetables", 74.0, "Kg", "Pungent, medicinal small shallots from Perambalur.", "/products/red_onions.png", 4.8, 280),
            ("Wood-Pressed Pure Groundnut Oil", "Organic", 240.0, "Litre", "Traditional mara chekku cold pressed groundnut oil.", "/products/cold_pressed_oil.png", 5.0, 80),
            ("Organic Erode Turmeric Powder", "Organic", 110.0, "Pack", "High curcumin pure turmeric grounded without additives.", "/products/fresh_turmeric.png", 4.9, 140),
            ("Salem Farm Fresh Alphonso Mangoes", "Fruits", 180.0, "Kg", "Tree-ripened, naturally sweet Salem farm mangoes.", "/products/alphonso_mangoes.png", 4.9, 90),
        ]

        # Insert or update products
        for name, category, price, unit, desc, img_url, rating, qty in catalog:
            existing = db.query(Product).filter(Product.name == name).first()
            if existing:
                existing.category = category
                existing.price = price
                existing.unit = unit
                existing.description = desc
                existing.image_url = img_url
                existing.rating = rating
                existing.available_qty = qty
                existing.status = "Active"
                existing.availability = "Available"
            else:
                p = Product(
                    name=name,
                    category=category,
                    price=price,
                    unit=unit,
                    description=desc,
                    image_url=img_url,
                    rating=rating,
                    available_qty=qty,
                    availability="Available",
                    status="Active",
                    farmer_id=farmer_profile.id,
                )
                db.add(p)

        db.commit()
        print("Successfully seeded 16 real agricultural products into database!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_product_images()
    seed_products_in_db()
