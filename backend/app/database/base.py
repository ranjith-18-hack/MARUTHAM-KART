# Import the SQLAlchemy Base class and all models
# so that Alembic can auto-detect the schema metadata
from app.database.connection import Base
from app.models.models import (
    Department, User, Employee, Farmer, Customer, B2BPartner, Driver,
    Vehicle, Product, Godown, WarehouseZone, Batch, InboundStock,
    InventoryItem, StockMovement, Order, OrderItem, OrderStatusHistory,
    TransportAssignment, Delivery, DeliveryOTP, Applicant,
    ApplicantDocument, Notification, Expense, Invoice, MonthlyReport, AuditLog
)
