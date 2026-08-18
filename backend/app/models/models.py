import uuid
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, Numeric, Boolean, Text, Float, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database.connection import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(50), nullable=True)
    description = Column(String(255), nullable=True)

    # Relationships
    employees = relationship("Employee", back_populates="department")
    expenses = relationship("Expense", back_populates="department")
    monthly_reports = relationship("MonthlyReport", back_populates="department")
    audit_logs = relationship("AuditLog", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(50), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)  # PIN hash or Password hash
    role = Column(String(100), nullable=False)  # customer, farmer, driver, etc.
    status = Column(String(50), nullable=False, default="Active")  # Active, Inactive, Suspended
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee_profile = relationship("Employee", back_populates="user", uselist=False, foreign_keys="Employee.id")
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False)
    customer_profile = relationship("Customer", back_populates="user", uselist=False)
    b2b_profile = relationship("B2BPartner", back_populates="user", uselist=False)
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    
    orders = relationship("Order", back_populates="customer")
    addresses = relationship("CustomerAddress", back_populates="user", cascade="all, delete-orphan")
    status_history_entries = relationship("OrderStatusHistory", back_populates="changed_by")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    stock_movements = relationship("StockMovement", back_populates="user")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    employee_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. MK-EMP-104
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    role = Column(String(100), nullable=False)  # e.g. HR Specialist, Godown Officer
    location = Column(String(255), nullable=False)
    joining_date = Column(DateTime, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    user = relationship("User", back_populates="employee_profile", foreign_keys=[id])
    department = relationship("Department", back_populates="employees")
    created_by = relationship("User", foreign_keys=[created_by_id])
    
    godowns = relationship("Godown", back_populates="officer")
    picking_orders = relationship("Order", foreign_keys="Order.picking_employee_id", back_populates="picking_employee")
    packing_orders = relationship("Order", foreign_keys="Order.packing_employee_id", back_populates="packing_employee")
    transport_assignments = relationship("TransportAssignment", back_populates="assigned_by")
    verified_documents = relationship("ApplicantDocument", back_populates="verified_by")
    assigned_applicants = relationship("Applicant", back_populates="assigned_officer")
    prepared_reports = relationship("MonthlyReport", foreign_keys="MonthlyReport.prepared_by_id", back_populates="prepared_by")
    approved_reports = relationship("MonthlyReport", foreign_keys="MonthlyReport.approved_by_id", back_populates="approved_by")
    expenses = relationship("Expense", back_populates="employee")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    farmer_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. f1
    location = Column(String(255), nullable=False)
    rating = Column(Float, default=5.0)
    products_supplied = Column(Integer, default=0)
    verified = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="farmer_profile")
    products = relationship("Product", back_populates="farmer")
    batches = relationship("Batch", back_populates="farmer")
    inventory_items = relationship("InventoryItem", back_populates="supplier")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    customer_code = Column(String(50), unique=True, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="customer_profile")


class B2BPartner(Base):
    __tablename__ = "b2b_partners"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    business_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. MK-BUS-001
    business_name = Column(String(255), nullable=False)
    business_type = Column(String(100), nullable=False)  # Hotel, Restaurant, B2B Partner
    location = Column(String(255), nullable=False)
    verification_status = Column(String(50), default="Verification Pending")  # Verified, Verification Pending, Rejected
    credit_limit = Column(Numeric(12, 2), default=50000.0)
    outstanding_balance = Column(Numeric(12, 2), default=0.0)
    payment_terms = Column(String(100), default="Net 15 Days")

    # Relationships
    user = relationship("User", back_populates="b2b_profile")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    driver_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. MK-DRI-045
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(100), nullable=False)  # Home Delivery Driver, Bulk Delivery Driver
    availability = Column(String(50), default="Available")  # Available, Assigned, On Route, Off Duty
    workload = Column(Integer, default=0)

    # Relationships
    user = relationship("User", back_populates="driver_profile")
    vehicle = relationship("Vehicle", foreign_keys=[vehicle_id], back_populates="assigned_drivers")
    transport_assignments = relationship("TransportAssignment", back_populates="driver")
    deliveries = relationship("Delivery", back_populates="driver")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. MK-V-1024
    number = Column(String(50), unique=True, nullable=False, index=True)  # e.g. TN-38-AB-1234
    type = Column(String(100), nullable=False)  # Two Wheeler, Mini Truck, Truck, etc.
    max_weight = Column(Numeric(10, 2), nullable=False)  # in kg
    max_volume = Column(Numeric(10, 2), nullable=False)  # in cubic meters
    capacity = Column(String(50), nullable=False)  # e.g. "1,000 kg"
    status = Column(String(50), default="Available")  # Available, Assigned, On Route, Maintenance
    service_status = Column(String(50), default="Healthy")  # Healthy, Service Due, Maintenance
    last_service = Column(String(100), nullable=True)
    next_service = Column(String(100), nullable=True)
    insurance_status = Column(String(50), default="Valid")  # Valid, Expiring Soon, Expired
    fitness_status = Column(String(50), default="Valid")  # Valid, Expired

    # Relationships
    assigned_drivers = relationship("Driver", foreign_keys="Driver.vehicle_id", back_populates="vehicle")
    transport_assignments = relationship("TransportAssignment", back_populates="vehicle")
    deliveries = relationship("Delivery", back_populates="vehicle")


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), nullable=False)  # kg, Litre, Packet
    availability = Column(String(50), default="Available")  # Available, Out of Stock, Low Stock
    available_qty = Column(Numeric(10, 2), default=0.0)
    status = Column(String(50), default="Active")  # Active, Inactive
    rating = Column(Float, default=5.0)
    image_url = Column(String(500), nullable=True)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False)
    description = Column(Text, nullable=True)
    quality_info = Column(String(255), nullable=True)
    harvest_date = Column(String(100), nullable=True)
    delivery_estimate = Column(String(100), nullable=True)

    # B2B Bulk pricing attributes
    min_bulk_qty = Column(Numeric(10, 2), nullable=True)
    price_tiers = Column(JSONB, nullable=True)  # [{min: 100, max: 499, price: 61}]

    # Relationships
    farmer = relationship("Farmer", back_populates="products")
    batches = relationship("Batch", back_populates="product")
    inventory_items = relationship("InventoryItem", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")


class Godown(Base):
    __tablename__ = "godowns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    godown_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. GD-CHENNAI-01
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    officer_in_charge = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    total_capacity = Column(Numeric(12, 2), nullable=False)  # in kg
    used_capacity = Column(Numeric(12, 2), default=0.0)

    # Relationships
    officer = relationship("Employee", back_populates="godowns")
    zones = relationship("WarehouseZone", back_populates="godown")
    deliveries = relationship("Delivery", back_populates="source_godown")


class WarehouseZone(Base):
    __tablename__ = "warehouse_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    godown_id = Column(UUID(as_uuid=True), ForeignKey("godowns.id"), nullable=False)
    name = Column(String(100), nullable=False)  # Grains Section, Dairy Cold Storage
    category = Column(String(100), nullable=False)  # Category it stores (Rice & Grains, Pulses)
    capacity = Column(Numeric(10, 2), nullable=False)
    current_stock = Column(Numeric(10, 2), default=0.0)
    temperature = Column(String(50), nullable=True)
    humidity = Column(String(50), nullable=True)

    # Relationships
    godown = relationship("Godown", back_populates="zones")
    batches = relationship("Batch", back_populates="storage_zone")
    inbound_stocks = relationship("InboundStock", back_populates="storage_zone")
    inventory_items = relationship("InventoryItem", back_populates="storage_zone")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_code = Column(String(100), unique=True, nullable=False, index=True)  # e.g. BATCH-MK-1024
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    received_date = Column(DateTime, default=datetime.utcnow)
    harvest_date = Column(String(100), nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    storage_zone_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_zones.id"), nullable=False)
    status = Column(String(50), default="Active")  # Active, Expiring Soon, Expired, Dispatched
    quality_status = Column(String(50), default="Good")  # Good, Average, Poor

    # Relationships
    product = relationship("Product", back_populates="batches")
    farmer = relationship("Farmer", back_populates="batches")
    storage_zone = relationship("WarehouseZone", back_populates="batches")
    inbound_stocks = relationship("InboundStock", back_populates="batch")
    inventory_items = relationship("InventoryItem", back_populates="batch")


class InboundStock(Base):
    __tablename__ = "inbound_stock"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    arrival_date = Column(DateTime, default=datetime.utcnow)
    quality_status = Column(String(50), nullable=False)
    inspection_status = Column(String(50), default="Pending")  # Pending, In Progress, Completed
    storage_zone_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_zones.id"), nullable=False)

    # Relationships
    batch = relationship("Batch", back_populates="inbound_stocks")
    storage_zone = relationship("WarehouseZone", back_populates="inbound_stocks")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=False)
    total_stock = Column(Numeric(10, 2), nullable=False)
    reserved_stock = Column(Numeric(10, 2), default=0.0)
    available_stock = Column(Numeric(10, 2), nullable=False)
    min_threshold = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), nullable=False)
    storage_zone_id = Column(UUID(as_uuid=True), ForeignKey("warehouse_zones.id"), nullable=False)
    status = Column(String(50), default="Healthy")  # Healthy, Low Stock, Critical, Out of Stock
    selling_price = Column(Numeric(10, 2), nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="inventory_items")
    batch = relationship("Batch", back_populates="inventory_items")
    storage_zone = relationship("WarehouseZone", back_populates="inventory_items")
    supplier = relationship("Farmer", back_populates="inventory_items")


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    prev_qty = Column(Numeric(10, 2), nullable=False)
    changed_qty = Column(Numeric(10, 2), nullable=False)
    new_qty = Column(Numeric(10, 2), nullable=False)
    reason = Column(String(255), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    type = Column(String(50), nullable=False)  # Addition, Removal, Adjustment

    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. ORD-MK-2045
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    buyer_type = Column(String(50), nullable=False)  # Customer, Business / Hotel
    total_amount = Column(Numeric(10, 2), nullable=False)
    required_date = Column(String(100), nullable=True)
    destination = Column(String(255), nullable=False)
    delivery_address = Column(Text, nullable=True)  # Full delivery address
    delivery_charge = Column(Numeric(10, 2), default=0.0)
    status = Column(String(50), default="Pending")  # Payment Pending, Pending, Processing, Picking, Packing, Ready for Dispatch, Dispatched, Delivered, Cancelled
    payment_method = Column(String(50), default="COD")  # COD, UPI, CARD, NETBANKING
    payment_status = Column(String(50), default="PENDING")  # CREATED, PENDING, AUTHORIZED, CAPTURED, COLLECTED, FAILED, CANCELLED, REFUNDED
    godown_id = Column(UUID(as_uuid=True), ForeignKey("godowns.id"), nullable=True)
    idempotency_key = Column(String(255), nullable=True, index=True)
    picking_employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    packing_employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    weight = Column(Numeric(10, 2), nullable=True)  # in kg
    volume = Column(Numeric(10, 2), nullable=True)  # in cubic meters
    notes = Column(Text, nullable=True)
    
    # 2-Minute SLA Tracking Timestamps & Metrics
    payment_verified_at = Column(DateTime, nullable=True)
    order_confirmed_at = Column(DateTime, nullable=True)
    godown_notified_at = Column(DateTime, nullable=True)
    picking_started_at = Column(DateTime, nullable=True)
    packing_completed_at = Column(DateTime, nullable=True)
    ready_for_dispatch_at = Column(DateTime, nullable=True)
    transport_queued_at = Column(DateTime, nullable=True)
    vehicle_assigned_at = Column(DateTime, nullable=True)
    driver_assigned_at = Column(DateTime, nullable=True)
    payment_to_driver_assignment_seconds = Column(Numeric(10, 2), nullable=True)
    payment_to_vehicle_assignment_seconds = Column(Numeric(10, 2), nullable=True)
    godown_to_transport_seconds = Column(Numeric(10, 2), nullable=True)
    assignment_sla_status = Column(String(50), default="WITHIN_SLA")  # WITHIN_SLA, APPROACHING_SLA, EXCEEDED_SLA
    assignment_delay_reason = Column(String(100), nullable=True)  # NO_ELIGIBLE_VEHICLE, NO_AVAILABLE_DRIVER, INVENTORY_SHORTAGE
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("User", back_populates="orders")
    assigned_godown = relationship("Godown", foreign_keys=[godown_id])
    picking_employee = relationship("Employee", foreign_keys=[picking_employee_id], back_populates="picking_orders")
    packing_employee = relationship("Employee", foreign_keys=[packing_employee_id], back_populates="packing_orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order")
    transport_assignments = relationship("TransportAssignment", back_populates="order")
    deliveries = relationship("Delivery", back_populates="order")
    otp_record = relationship("DeliveryOTP", uselist=False, back_populates="order")
    invoice = relationship("Invoice", uselist=False, back_populates="order")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), nullable=False)
    changed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="status_history")
    changed_by = relationship("User", back_populates="status_history_entries")


class TransportAssignment(Base):
    __tablename__ = "transport_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False)
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    assignment_time = Column(DateTime, default=datetime.utcnow)
    payment_verified_at = Column(DateTime, nullable=True)
    assignment_duration_seconds = Column(Numeric(10, 2), nullable=True)
    sla_status = Column(String(50), default="WITHIN_SLA")  # WITHIN_SLA, APPROACHING_SLA, EXCEEDED_SLA
    status = Column(String(50), default="Assigned")  # Assigned, Dispatched, Completed

    # Relationships
    order = relationship("Order", back_populates="transport_assignments")
    vehicle = relationship("Vehicle", back_populates="transport_assignments")
    driver = relationship("Driver", back_populates="transport_assignments")
    assigned_by = relationship("Employee", back_populates="transport_assignments")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    type = Column(String(100), nullable=False)  # Home Delivery, Bulk Delivery
    source_godown_id = Column(UUID(as_uuid=True), ForeignKey("godowns.id"), nullable=False)
    destination = Column(String(255), nullable=False)
    quantity = Column(String(50), nullable=False)  # e.g., "12 kg"
    priority = Column(String(50), default="Normal")  # Normal, High, Urgent
    status = Column(String(100), default="Awaiting Assignment")  # Awaiting Assignment, Driver Assigned, On Route, Delivered
    assignment_sla_status = Column(String(50), default="WITHIN_SLA")
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)
    eta = Column(String(100), nullable=True)
    delay_reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="deliveries")
    source_godown = relationship("Godown", back_populates="deliveries")
    vehicle = relationship("Vehicle", back_populates="deliveries")
    driver = relationship("Driver", back_populates="deliveries")


class DeliveryOTP(Base):
    __tablename__ = "delivery_otp"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    otp_code = Column(String(10), nullable=True)  # Plain 4-digit code for customer view
    otp_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=3)

    # Relationships
    order = relationship("Order", back_populates="otp_record")


class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    applicant_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. APP-HB-1001
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # Hotel / Business, Driver, Vehicle Owner, Employee
    type = Column(String(100), nullable=True)  # e.g., Hotel, Bulk Delivery, Operations Executive
    location = Column(String(255), nullable=False)
    submitted_date = Column(String(100), nullable=False)  # e.g., "12 Aug 2026"
    status = Column(String(50), default="New")  # New, Verification Pending, Approved, Account Created
    assigned_officer_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    assigned_officer = relationship("Employee", back_populates="assigned_applicants")
    documents = relationship("ApplicantDocument", back_populates="applicant", cascade="all, delete-orphan")


class ApplicantDocument(Base):
    __tablename__ = "applicant_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("applicants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)  # Business Registration, Driving License
    type = Column(String(100), nullable=False)  # Business Document, Identity Document
    status = Column(String(50), default="Submitted")  # Submitted, Under Review, Verified, Rejected
    submitted_date = Column(String(100), nullable=True)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    verified_date = Column(String(100), nullable=True)

    # Relationships
    applicant = relationship("Applicant", back_populates="documents")
    verified_by = relationship("Employee", back_populates="verified_documents")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    status = Column(String(50), default="Pending")  # Paid, Pending, Rejected

    # Relationships
    department = relationship("Department", back_populates="expenses")
    employee = relationship("Employee", back_populates="expenses")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Pending")  # Paid, Pending, Overdue

    # Relationships
    order = relationship("Order", back_populates="invoice")


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_code = Column(String(100), unique=True, nullable=False, index=True)  # e.g., MK-GD-CHN-2026-08-001
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    location = Column(String(255), nullable=False)
    month = Column(String(50), nullable=False)  # e.g., "August 2026"
    generated_date = Column(DateTime, default=datetime.utcnow)
    prepared_by_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True)
    summary = Column(JSONB, nullable=False)  # json summary: opening_balance, income, expenses
    activity_summary = Column(JSONB, nullable=False)  # json counts: stock_received, etc.
    status = Column(String(100), default="Draft")  # Draft, Submitted, Finance Review, Finalized
    reconciliation_status = Column(String(50), default="Clean")  # Clean, Issues Found
    digital_approval_status = Column(String(50), default="Not Signed")  # Officer Signed, Finance Signed

    # Relationships
    department = relationship("Department", back_populates="monthly_reports")
    prepared_by = relationship("Employee", foreign_keys=[prepared_by_id], back_populates="prepared_reports")
    approved_by = relationship("Employee", foreign_keys=[approved_by_id], back_populates="approved_reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    performed_by = Column(String(255), nullable=False)  # e.g. "MK-EMP-104"
    action = Column(String(100), nullable=False)  # e.g., "Stock Received"
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    entity_type = Column(String(100), nullable=False)  # e.g., "Order", "Product"
    entity_id = Column(String(100), nullable=False)
    previous_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    reason = Column(String(255), nullable=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    department = relationship("Department", back_populates="audit_logs")


# ── Phase 4: Cart ─────────────────────────────────────────────────────────────

class Cart(Base):
    """
    One cart per customer.  Persists across sessions until an order is placed.
    """
    __tablename__ = "carts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,  # one cart per customer
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id])
    items = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
    )


class CartItem(Base):
    """
    One row per distinct product in a customer's cart.
    """
    __tablename__ = "cart_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(
        UUID(as_uuid=True),
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = Column(
        UUID(as_uuid=True),
        ForeignKey("products.id"),
        nullable=False,
    )
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)  # snapshotted at add-time
    added_at = Column(DateTime, default=datetime.utcnow)

    # Unique: one row per product per cart
    __table_args__ = (
        __import__('sqlalchemy').UniqueConstraint('cart_id', 'product_id', name='uq_cart_product'),
    )

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")


# ── Phase 5: Godown / Warehouse Operations ────────────────────────────────────

class GodownUserAssignment(Base):
    """
    Tracks which godown(s) a user (GODOWN_MANAGER / EMPLOYEE) is assigned to.
    Admin can access all godowns — no row needed for admins.
    """
    __tablename__ = "godown_user_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    godown_id = Column(UUID(as_uuid=True), ForeignKey("godowns.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    user = relationship("User")
    godown = relationship("Godown")

    __table_args__ = (
        __import__('sqlalchemy').UniqueConstraint('user_id', 'godown_id', name='uq_godown_user'),
    )


class ProductLocation(Base):
    """
    Physical location of a product inside a godown: Rack → Shelf → Bin.
    """
    __tablename__ = "product_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    godown_id = Column(UUID(as_uuid=True), ForeignKey("godowns.id", ondelete="CASCADE"), nullable=False, index=True)
    rack = Column(String(50), nullable=True)    # e.g. "Rack A"
    shelf = Column(String(50), nullable=True)   # e.g. "Shelf 03"
    bin = Column(String(50), nullable=True)     # e.g. "Bin 12"
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product = relationship("Product")
    godown = relationship("Godown")

    __table_args__ = (
        __import__('sqlalchemy').UniqueConstraint('product_id', 'godown_id', name='uq_product_godown_location'),
    )


class InventoryReservation(Base):
    """
    Reserves stock when an order moves to Processing.
    Released when order is Cancelled or Delivered.
    """
    __tablename__ = "inventory_reservations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    reserved_qty = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), default="Active")  # Active, Released, Consumed
    created_at = Column(DateTime, default=datetime.utcnow)
    released_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order")
    product = relationship("Product")


class PickingRecord(Base):
    """
    Tracks picking of individual order items.
    One row per order item during the picking phase.
    """
    __tablename__ = "picking_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    order_item_id = Column(UUID(as_uuid=True), ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    required_qty = Column(Numeric(10, 2), nullable=False)
    picked_qty = Column(Numeric(10, 2), default=0.0)
    status = Column(String(50), default="Pending")  # Pending, Picked, Partial
    picked_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    picked_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    order = relationship("Order")
    order_item = relationship("OrderItem")
    product = relationship("Product")
    picked_by = relationship("User")


class PackingRecord(Base):
    """
    Tracks packing details for an order after picking is complete.
    """
    __tablename__ = "packing_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    packed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    package_count = Column(Integer, default=1)
    total_weight_kg = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    packed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="Pending")  # Pending, Completed

    # Relationships
    order = relationship("Order")
    packed_by = relationship("User")


class GodownAlert(Base):
    """
    Low-stock and inventory alerts for the Godown Manager.
    """
    __tablename__ = "godown_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    godown_id = Column(UUID(as_uuid=True), ForeignKey("godowns.id", ondelete="CASCADE"), nullable=True, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    alert_type = Column(String(100), nullable=False)  # LOW_STOCK, OUT_OF_STOCK, EXPIRY_SOON, DAMAGE
    severity = Column(String(50), default="Medium")    # Low, Medium, High, Critical
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    godown = relationship("Godown")
    product = relationship("Product")
    resolved_by = relationship("User")


class OnboardingTask(Base):
    """
    Onboarding checklist item for new recruits (Business, Driver, Vehicle, Employee).
    """
    __tablename__ = "onboarding_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(50), nullable=False, index=True)  # Business, Driver, Vehicle, Employee
    task_name = Column(String(255), nullable=False)
    status = Column(String(50), default="pending")  # completed, pending, upcoming
    order_num = Column(Integer, default=0)
    target_id = Column(UUID(as_uuid=True), nullable=True)  # user_id / applicant_id / vehicle_id
    completed_at = Column(DateTime, nullable=True)
    completed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    completed_by = relationship("User")


# ── Phase 8: Complete Portal & Operations Models ──────────────────────────────

class FarmerPickup(Base):
    """
    Procurement pickup scheduled from farmer location.
    """
    __tablename__ = "farmer_pickups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pickup_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. PK-MK-1001
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), default="kg")
    scheduled_date = Column(DateTime, default=datetime.utcnow)
    pickup_location = Column(String(255), nullable=False)
    status = Column(String(50), default="Scheduled")  # Scheduled, Driver Assigned, In Transit, Completed, Cancelled
    assigned_driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True)
    assigned_vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer")
    product = relationship("Product")
    assigned_driver = relationship("Driver")
    assigned_vehicle = relationship("Vehicle")


class FarmerPayout(Base):
    """
    Payout ledger for produce procurement payments to farmers.
    """
    __tablename__ = "farmer_payouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payout_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. PO-MK-8001
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), default="Bank Transfer")  # Bank Transfer, UPI, Cash
    status = Column(String(50), default="Pending")  # Pending, Processing, Paid, Failed
    reference_number = Column(String(100), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer")


class B2BQuote(Base):
    """
    Custom price quote request from B2B / Hotel buyers.
    """
    __tablename__ = "b2b_quotes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. QT-MK-4001
    partner_id = Column(UUID(as_uuid=True), ForeignKey("b2b_partners.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="Pending")  # Pending, Sent, Accepted, Rejected, Expired
    total_estimated_amount = Column(Numeric(12, 2), default=0.0)
    valid_until = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    partner = relationship("B2BPartner")
    items = relationship("B2BQuoteItem", back_populates="quote", cascade="all, delete-orphan")


class B2BQuoteItem(Base):
    """
    Individual product line item within a B2B quotation.
    """
    __tablename__ = "b2b_quote_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("b2b_quotes.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    requested_quantity = Column(Numeric(10, 2), nullable=False)
    quoted_unit_price = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), default="kg")

    # Relationships
    quote = relationship("B2BQuote", back_populates="items")
    product = relationship("Product")


class B2BRecurringOrder(Base):
    """
    Automated standing subscription for hotels & restaurants.
    """
    __tablename__ = "b2b_recurring_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recurring_code = Column(String(50), unique=True, nullable=False, index=True)  # e.g. REC-MK-6001
    partner_id = Column(UUID(as_uuid=True), ForeignKey("b2b_partners.id", ondelete="CASCADE"), nullable=False, index=True)
    frequency = Column(String(50), nullable=False)  # Daily, Weekly, Bi-Weekly, Monthly
    delivery_day = Column(String(50), nullable=True)  # Monday, Tuesday, etc.
    destination = Column(String(255), nullable=False)
    next_run_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="Active")  # Active, Paused, Cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    partner = relationship("B2BPartner")
    items = relationship("B2BRecurringOrderItem", back_populates="recurring_order", cascade="all, delete-orphan")


class B2BRecurringOrderItem(Base):
    """
    Items in a recurring standing order.
    """
    __tablename__ = "b2b_recurring_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recurring_order_id = Column(UUID(as_uuid=True), ForeignKey("b2b_recurring_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50), default="kg")

    # Relationships
    recurring_order = relationship("B2BRecurringOrder", back_populates="items")
    product = relationship("Product")


class CustomerAddress(Base):
    __tablename__ = "customer_addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    address_label = Column(String(50), default="Home")  # Home, Work, Other
    door_no = Column(String(50), nullable=True)
    street_address = Column(Text, nullable=False)
    area = Column(String(100), nullable=False)  # Locality / Area
    city = Column(String(100), nullable=False)
    state = Column(String(100), default="Tamil Nadu")
    postal_code = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="addresses")


class PhoneOTP(Base):
    __tablename__ = "phone_otps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(50), nullable=False, index=True)
    otp_hash = Column(String(255), nullable=False)
    purpose = Column(String(50), default="login")  # login, register, verify_phone
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)
    max_attempts = Column(Integer, default=5)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Phase 9: Payment & Financial Settlement ───────────────────────────────────

class Payment(Base):
    """
    Authoritative payment record for an order across Razorpay, UPI, Cards, and COD.
    """
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    gateway = Column(String(50), nullable=False, default="razorpay")  # razorpay, cod_internal, cashfree
    gateway_order_id = Column(String(255), nullable=True, index=True)  # e.g. order_xyz123
    gateway_payment_id = Column(String(255), nullable=True, index=True)  # e.g. pay_xyz456
    gateway_signature = Column(String(255), nullable=True)
    payment_method = Column(String(50), nullable=False, default="UPI")  # COD, UPI, CARD, NETBANKING
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="CREATED")  # CREATED, PENDING, AUTHORIZED, CAPTURED, COLLECTED, FAILED, CANCELLED, REFUNDED
    vpa = Column(String(100), nullable=True)  # UPI VPA / ID
    failure_reason = Column(Text, nullable=True)
    idempotency_key = Column(String(255), nullable=True, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    refund_id = Column(String(255), nullable=True)
    refund_amount = Column(Numeric(10, 2), nullable=True)
    refunded_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="payments")
    customer = relationship("User")


class PaymentAuditLog(Base):
    """
    Immutable audit trail for financial events, signature verifications, and webhooks.
    """
    __tablename__ = "payment_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id", ondelete="CASCADE"), nullable=True, index=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False)  # INTENT_CREATED, SIGNATURE_VERIFIED, WEBHOOK_CAPTURED, COD_COLLECTED, REFUND_ISSUED, FAILED
    payload = Column(JSONB, nullable=False, default={})
    performed_by = Column(String(255), nullable=False, default="SYSTEM")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    payment = relationship("Payment")
    order = relationship("Order")


class DomainEvent(Base):
    """
    Immutable domain event record for decoupled event-driven operational workflow.
    """
    __tablename__ = "domain_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False, index=True)
    aggregate_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    aggregate_type = Column(String(50), nullable=False, default="ORDER")  # ORDER, PAYMENT, DELIVERY, GODOWN
    payload = Column(JSONB, nullable=False, default={})
    status = Column(String(50), default="PROCESSED")  # PENDING, PROCESSED, FAILED
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime, default=datetime.utcnow)


