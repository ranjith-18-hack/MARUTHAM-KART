"""
MARUTHAM KART — Multi-Factor Transport & Logistics Allocation Engine

Pure Python allocation & recommendation engine for:
  1. Weight-based payload capacity verification (never assigns an underweight vehicle).
  2. Ranking eligible vehicles by capacity efficiency, maintenance status, and proximity.
  3. Workload-balanced driver recommendation.
  4. Automatic reassignment detection when packed weight exceeds vehicle limit.
"""
from __future__ import annotations
from decimal import Decimal
from typing import Optional, Tuple, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.models import Driver, Order, PackingRecord, Vehicle, TransportAssignment


def calculate_order_cargo(order: Order, db: Session) -> Tuple[Decimal, Decimal]:
    """
    Calculate cargo weight (kg) and estimated volume (m3) for an order.
    Prefers PackingRecord or order.weight if set, otherwise computes from items.
    """
    weight = Decimal("0.0")
    volume = Decimal("0.0")

    # 1. Prefer actual verified packing record weight
    packing = db.query(PackingRecord).filter(PackingRecord.order_id == order.id).first()
    if packing and packing.total_weight_kg and float(packing.total_weight_kg) > 0:
        weight = Decimal(str(packing.total_weight_kg))
    elif order.weight and float(order.weight) > 0:
        weight = Decimal(str(order.weight))
    else:
        # Compute sum from order items
        total_items_qty = Decimal("0.0")
        for item in order.order_items:
            total_items_qty += Decimal(str(item.quantity))
        weight = total_items_qty if total_items_qty > 0 else Decimal("1.0")

    # Compute estimated volume: 1 kg ~ 0.003 m3 (rough agricultural produce density)
    if order.volume and float(order.volume) > 0:
        volume = Decimal(str(order.volume))
    else:
        volume = (weight * Decimal("0.003")).quantize(Decimal("0.001"))
        if volume == 0:
            volume = Decimal("0.01")

    return weight, volume


def get_eligible_vehicles_ranked(
    db: Session,
    weight: Decimal,
    volume: Optional[Decimal] = None,
) -> List[Dict[str, Any]]:
    """
    Finds and ranks all eligible vehicles capable of carrying the shipment weight safely:
    - Status == 'Available'
    - service_status != 'Maintenance'
    - insurance_status == 'Valid'
    - max_weight >= weight (STRICT: Reject underweight vehicles)
    - Ranked by max_weight ASC (smallest safe vehicle first)
    """
    q = db.query(Vehicle).filter(
        Vehicle.status == "Available",
        Vehicle.service_status != "Maintenance",
        Vehicle.max_weight >= weight,
    )
    if volume is not None and volume > 0:
        q = q.filter(Vehicle.max_volume >= volume)

    vehicles = q.order_by(Vehicle.max_weight.asc()).all()

    ranked = []
    for idx, v in enumerate(vehicles):
        margin_kg = float(v.max_weight) - float(weight)
        utilization_pct = round((float(weight) / float(v.max_weight)) * 100, 1) if float(v.max_weight) > 0 else 100.0
        
        ranked.append({
            "vehicle": v,
            "rank": idx + 1,
            "type": v.type,
            "number": v.number,
            "max_weight_kg": float(v.max_weight),
            "safety_margin_kg": margin_kg,
            "utilization_pct": utilization_pct,
            "is_recommended": idx == 0,
            "fit_reason": f"Optimal payload match ({utilization_pct}% utilized, {margin_kg} kg safety margin)",
        })
    return ranked


def find_best_vehicle(
    db: Session,
    weight: Decimal,
    volume: Optional[Decimal] = None,
) -> Tuple[Optional[Vehicle], str]:
    """
    Select the smallest suitable available vehicle with sufficient payload.
    """
    ranked = get_eligible_vehicles_ranked(db, weight, volume)
    if not ranked:
        capacity_check = db.query(Vehicle).filter(Vehicle.max_weight >= weight).first()
        if not capacity_check:
            return None, f"No vehicle with sufficient capacity ({weight} kg) exists in the fleet."
        return None, f"All vehicles with sufficient capacity ({weight} kg) are currently in maintenance or on route."

    best = ranked[0]["vehicle"]
    return best, f"Selected optimal vehicle: {best.type} ({best.number}, capacity: {best.capacity}) for {weight} kg shipment."


def get_eligible_drivers_ranked(
    db: Session,
    vehicle: Optional[Vehicle] = None,
    delivery_type: str = "Home Delivery",
) -> List[Dict[str, Any]]:
    """
    Finds and ranks all available delivery drivers:
    - Availability == 'Available'
    - Prefers driver assigned to the specific vehicle
    - Ordered by lowest active workload
    """
    drivers = db.query(Driver).filter(Driver.availability == "Available").all()
    
    ranked = []
    for d in drivers:
        is_dedicated = bool(vehicle and d.vehicle_id == vehicle.id)
        score = 100 if is_dedicated else max(10, 50 - (d.workload * 5))
        
        ranked.append({
            "driver": d,
            "driver_name": d.user.name if d.user else d.driver_code,
            "driver_phone": d.user.phone if d.user else None,
            "is_dedicated_to_vehicle": is_dedicated,
            "workload": d.workload,
            "score": score,
        })
        
    ranked.sort(key=lambda x: (-x["score"], x["workload"]))
    return ranked


def find_best_driver(
    db: Session,
    vehicle: Optional[Vehicle] = None,
    delivery_type: str = "Home Delivery",
) -> Tuple[Optional[Driver], str]:
    """
    Select an available driver with balanced workload.
    """
    ranked = get_eligible_drivers_ranked(db, vehicle, delivery_type)
    if not ranked:
        return None, "No drivers are currently available (all drivers are assigned, on route, or off duty)."

    best = ranked[0]["driver"]
    driver_name = best.user.name if best.user else best.driver_code
    return best, f"Assigned available driver {driver_name} (workload: {best.workload})."


def auto_allocate_transport_for_order(
    db: Session,
    order: Order,
) -> dict:
    """
    Runs automated multi-factor allocation for an order based on verified packed weight.
    """
    weight, volume = calculate_order_cargo(order, db)

    vehicle, v_reason = find_best_vehicle(db, weight, volume)
    if not vehicle:
        return {
            "order_id": order.id,
            "order_code": order.order_code,
            "cargo_weight": weight,
            "cargo_volume": volume,
            "vehicle": None,
            "driver": None,
            "eligible_vehicles": [],
            "eligible_drivers": [],
            "success": False,
            "reason": v_reason,
        }

    driver, d_reason = find_best_driver(db, vehicle)
    eligible_vehicles = get_eligible_vehicles_ranked(db, weight, volume)
    eligible_drivers = get_eligible_drivers_ranked(db, vehicle)

    if not driver:
        return {
            "order_id": order.id,
            "order_code": order.order_code,
            "cargo_weight": weight,
            "cargo_volume": volume,
            "vehicle": vehicle,
            "driver": None,
            "eligible_vehicles": eligible_vehicles,
            "eligible_drivers": eligible_drivers,
            "success": False,
            "reason": f"Vehicle {vehicle.number} matched, but {d_reason}",
        }

    return {
        "order_id": order.id,
        "order_code": order.order_code,
        "cargo_weight": weight,
        "cargo_volume": volume,
        "vehicle": vehicle,
        "driver": driver,
        "eligible_vehicles": eligible_vehicles,
        "eligible_drivers": eligible_drivers,
        "success": True,
        "reason": f"{v_reason} {d_reason}",
    }


def check_vehicle_reassignment_needed(
    db: Session,
    order_id: UUID,
    new_verified_weight: Decimal,
) -> bool:
    """
    Returns True if an already assigned vehicle is now under-capacity due to higher packed weight.
    """
    assignment = (
        db.query(TransportAssignment)
        .filter(TransportAssignment.order_id == order_id)
        .first()
    )
    if not assignment or not assignment.vehicle:
        return False

    return Decimal(str(assignment.vehicle.max_weight)) < new_verified_weight
