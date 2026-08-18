"""phase8_complete_backend

Revision ID: 42c98ef739e1
Revises: 41c84cf629d5
Create Date: 2026-08-16 08:44:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '42c98ef739e1'
down_revision: Union[str, Sequence[str], None] = '41c84cf629d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema for Phase 8."""
    # B2B Partner enhancements
    op.add_column('b2b_partners', sa.Column('credit_limit', sa.Numeric(precision=12, scale=2), server_default='50000.0', nullable=True))
    op.add_column('b2b_partners', sa.Column('outstanding_balance', sa.Numeric(precision=12, scale=2), server_default='0.0', nullable=True))
    op.add_column('b2b_partners', sa.Column('payment_terms', sa.String(length=100), server_default='Net 15 Days', nullable=True))

    # Farmer Pickups
    op.create_table(
        'farmer_pickups',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('pickup_code', sa.String(length=50), nullable=False),
        sa.Column('farmer_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('unit', sa.String(length=50), server_default='kg', nullable=False),
        sa.Column('scheduled_date', sa.DateTime(), nullable=True),
        sa.Column('pickup_location', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Scheduled', nullable=False),
        sa.Column('assigned_driver_id', sa.UUID(), nullable=True),
        sa.Column('assigned_vehicle_id', sa.UUID(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assigned_driver_id'], ['drivers.id'], ),
        sa.ForeignKeyConstraint(['assigned_vehicle_id'], ['vehicles.id'], ),
        sa.ForeignKeyConstraint(['farmer_id'], ['farmers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_farmer_pickups_pickup_code'), 'farmer_pickups', ['pickup_code'], unique=True)
    op.create_index(op.f('ix_farmer_pickups_farmer_id'), 'farmer_pickups', ['farmer_id'], unique=False)

    # Farmer Payouts
    op.create_table(
        'farmer_payouts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('payout_code', sa.String(length=50), nullable=False),
        sa.Column('farmer_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('payment_method', sa.String(length=50), server_default='Bank Transfer', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Pending', nullable=False),
        sa.Column('reference_number', sa.String(length=100), nullable=True),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['farmer_id'], ['farmers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_farmer_payouts_payout_code'), 'farmer_payouts', ['payout_code'], unique=True)
    op.create_index(op.f('ix_farmer_payouts_farmer_id'), 'farmer_payouts', ['farmer_id'], unique=False)

    # B2B Quotes
    op.create_table(
        'b2b_quotes',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('quote_code', sa.String(length=50), nullable=False),
        sa.Column('partner_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Pending', nullable=False),
        sa.Column('total_estimated_amount', sa.Numeric(precision=12, scale=2), server_default='0.0', nullable=False),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['partner_id'], ['b2b_partners.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_b2b_quotes_quote_code'), 'b2b_quotes', ['quote_code'], unique=True)
    op.create_index(op.f('ix_b2b_quotes_partner_id'), 'b2b_quotes', ['partner_id'], unique=False)

    # B2B Quote Items
    op.create_table(
        'b2b_quote_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('quote_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('requested_quantity', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quoted_unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('unit', sa.String(length=50), server_default='kg', nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['quote_id'], ['b2b_quotes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_b2b_quote_items_quote_id'), 'b2b_quote_items', ['quote_id'], unique=False)

    # B2B Recurring Orders
    op.create_table(
        'b2b_recurring_orders',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('recurring_code', sa.String(length=50), nullable=False),
        sa.Column('partner_id', sa.UUID(), nullable=False),
        sa.Column('frequency', sa.String(length=50), nullable=False),
        sa.Column('delivery_day', sa.String(length=50), nullable=True),
        sa.Column('destination', sa.String(length=255), nullable=False),
        sa.Column('next_run_date', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Active', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['partner_id'], ['b2b_partners.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_b2b_recurring_orders_recurring_code'), 'b2b_recurring_orders', ['recurring_code'], unique=True)
    op.create_index(op.f('ix_b2b_recurring_orders_partner_id'), 'b2b_recurring_orders', ['partner_id'], unique=False)

    # B2B Recurring Order Items
    op.create_table(
        'b2b_recurring_order_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('recurring_order_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('unit', sa.String(length=50), server_default='kg', nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['recurring_order_id'], ['b2b_recurring_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_b2b_recurring_order_items_recurring_order_id'), 'b2b_recurring_order_items', ['recurring_order_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('b2b_recurring_order_items')
    op.drop_table('b2b_recurring_orders')
    op.drop_table('b2b_quote_items')
    op.drop_table('b2b_quotes')
    op.drop_table('farmer_payouts')
    op.drop_table('farmer_pickups')
    op.drop_column('b2b_partners', 'payment_terms')
    op.drop_column('b2b_partners', 'outstanding_balance')
    op.drop_column('b2b_partners', 'credit_limit')
