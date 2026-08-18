"""
MARUTHAM KART — PostgreSQL Database Migration for Workflow Automation & Domain Events
"""
from sqlalchemy import text
from app.database.connection import engine, Base
from app.models.models import DomainEvent, Order, Delivery, PackingRecord, PickingRecord

def migrate():
    print("[MIGRATION] Connecting to PostgreSQL database...")
    with engine.begin() as conn:
        print("[MIGRATION] Creating 'domain_events' table if not exists...")
        Base.metadata.create_all(bind=conn)

        print("[MIGRATION] Ensuring indexes on orders, deliveries, domain_events...")
        conn.execute(text("""
            ALTER TABLE delivery_otp ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
            CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
            CREATE INDEX IF NOT EXISTS idx_orders_godown_id ON orders(godown_id);
            CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
            CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
            CREATE INDEX IF NOT EXISTS idx_domain_events_type ON domain_events(event_type);
            CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON domain_events(aggregate_id);
        """))

        print("[MIGRATION] SUCCESS: Workflow automation database migration completed.")

if __name__ == "__main__":
    migrate()
