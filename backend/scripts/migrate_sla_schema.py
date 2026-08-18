"""
MARUTHAM KART — PostgreSQL Migration Script for 2-Minute Assignment SLA Schema

Adds:
- Timestamp columns to `orders`:
    payment_verified_at, order_confirmed_at, godown_notified_at, picking_started_at,
    packing_completed_at, ready_for_dispatch_at, transport_queued_at,
    vehicle_assigned_at, driver_assigned_at
- Duration & SLA metric columns to `orders`:
    payment_to_driver_assignment_seconds, payment_to_vehicle_assignment_seconds,
    godown_to_transport_seconds, assignment_sla_status, assignment_delay_reason
- SLA tracking columns to `transport_assignments`:
    payment_verified_at, assignment_duration_seconds, sla_status
- SLA columns to `deliveries`:
    assignment_sla_status
- Indexes on `orders(assignment_sla_status)`, `orders(payment_verified_at)`, `orders(driver_assigned_at)`
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.connection import engine

MIGRATION_SQL = """
-- 1. Extend orders table with SLA timestamps and metrics
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS order_confirmed_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS godown_notified_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS picking_started_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS packing_completed_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS ready_for_dispatch_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS transport_queued_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS vehicle_assigned_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_to_driver_assignment_seconds NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS payment_to_vehicle_assignment_seconds NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS godown_to_transport_seconds NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS assignment_sla_status VARCHAR(50) DEFAULT 'WITHIN_SLA',
ADD COLUMN IF NOT EXISTS assignment_delay_reason VARCHAR(100);

-- 2. Extend transport_assignments table
ALTER TABLE transport_assignments
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITHOUT TIME ZONE,
ADD COLUMN IF NOT EXISTS assignment_duration_seconds NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS sla_status VARCHAR(50) DEFAULT 'WITHIN_SLA';

-- 3. Extend deliveries table
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS assignment_sla_status VARCHAR(50) DEFAULT 'WITHIN_SLA';

-- 4. Create performance indexes for SLA reporting and tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment_verified_at ON orders(payment_verified_at);
CREATE INDEX IF NOT EXISTS idx_orders_driver_assigned_at ON orders(driver_assigned_at);
CREATE INDEX IF NOT EXISTS idx_orders_assignment_sla_status ON orders(assignment_sla_status);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_sla ON transport_assignments(sla_status);
"""

def run_migration():
    print("Connecting to Supabase PostgreSQL database to apply SLA schema migration...")
    with engine.begin() as conn:
        conn.execute(text(MIGRATION_SQL))
    print("SLA Schema migration applied successfully!")

if __name__ == "__main__":
    run_migration()
