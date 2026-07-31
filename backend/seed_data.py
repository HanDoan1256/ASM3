from app.database.session import SessionLocal
from app.models.service_option import ServiceOption

def seed():
    db = SessionLocal()
    try:
        # Clear existing service options to ensure a clean slate
        existing_count = db.query(ServiceOption).count()
        if existing_count > 0:
            print(f"Deleting {existing_count} existing service option(s)...")
            db.query(ServiceOption).delete()
            db.commit()

        # List of domestic logistics service options based on Vietnamese market standards
        service_options = [
            ServiceOption(
                service_name="Standard Freight",
                description="Economical ground transport for general cargo (2-4 days short routes, 5-12 days long-distance/cross-country).",
                base_price=22000.0,
                estimated_days=7
            ),
            ServiceOption(
                service_name="Express Freight",
                description="Priority air or direct express road shipping for urgent items across all domestic routes.",
                base_price=55000.0,
                estimated_days=2
            ),
            ServiceOption(
                service_name="Electronics & Fragile",
                description="Specialized handling for laptops, smartphones, and glass items with bubble wrapping and insurance coverage.",
                base_price=85000.0,
                estimated_days=3
            ),
            ServiceOption(
                service_name="Food & Perishables",
                description="Fast-track transit for dried food, baked goods, and fresh produce without heavy stack pressure.",
                base_price=45000.0,
                estimated_days=2
            ),
            ServiceOption(
                service_name="Cold Chain Freight",
                description="Temperature-controlled logistics (-18°C to 5°C) using specialized refrigerated vehicles for seafood, meat, and vaccines.",
                base_price=170000.0,
                estimated_days=2
            ),
            ServiceOption(
                service_name="Sealed & Secure Document",
                description="High-security transportation for bid dossiers, legal contracts, and valuable items with tamper-evident seals and tracking.",
                base_price=90000.0,
                estimated_days=1
            )
        ]

        db.add_all(service_options)
        db.commit()
        print("---------------------------------------------")
        print("✅ SERVICE OPTIONS RE-SEEDED SUCCESSFULLY!")
        print("---------------------------------------------")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding service options: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()