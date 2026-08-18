"""
MARUTHAM KART — PostgreSQL Database Migration for Phase 9 Payments

Adds required columns to orders table:
- payment_method VARCHAR(50) DEFAULT 'COD'
- payment_status VARCHAR(50) DEFAULT 'PENDING'
- godown_id UUID REFERENCES godowns(id)
- idempotency_key VARCHAR(255)

Creates tables:
- payments
- payment_audit_logs
"""
import sys
from sqlalchemy import text
from app.database.connection import engine, Base
from app.models.models import Payment, PaymentAuditLog, Order, PhoneOTP

def migrate():
    print("[MIGRATION] Connecting to PostgreSQL database...")
    with engine.begin() as conn:
        print("[MIGRATION] Altering 'orders' table to add payment columns...")
        conn.execute(text("""
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'COD',
            ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING',
            ADD COLUMN IF NOT EXISTS godown_id UUID REFERENCES godowns(id),
            ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
        """))
        
        # Create index on idempotency_key if not exists
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
        """))
        
        print("[MIGRATION] Creating 'payments' and 'payment_audit_logs' tables...")
        Base.metadata.create_all(bind=conn)
        
        print("[MIGRATION] SUCCESS: Payment schema migrated successfully.")

if __name__ == "__main__":
    migrate()
