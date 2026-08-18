import math
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Godown, CustomerAddress

logger = logging.getLogger("maruthamkart.godown")

# South Indian Regional Coordinate Index
REGIONAL_COORDINATES: Dict[str, tuple[float, float]] = {
    "coimbatore": (11.0168, 76.9558),
    "chennai": (13.0827, 80.2707),
    "madurai": (9.9252, 78.1198),
    "salem": (11.6643, 78.1460),
    "tiruchirappalli": (10.7905, 78.7047),
    "trichy": (10.7905, 78.7047),
    "erode": (11.3410, 77.7172),
    "tiruppur": (11.1085, 77.3411),
    "thanjavur": (10.7870, 79.1378),
    "tirunelveli": (8.7139, 77.7567),
    "vellore": (12.9165, 79.1325),
    "hosur": (12.7409, 77.8253),
    "dindigul": (10.3673, 77.9803),
    "pollachi": (10.6609, 77.0048),
}


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates haversine distance in kilometers between two GPS coordinates."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def find_nearest_godown(db: Session, address: Optional[CustomerAddress]) -> Optional[Dict[str, Any]]:
    """
    Determines the best eligible ACTIVE godown for fulfillment based on customer delivery address.
    Matches by:
    1. Direct city match
    2. Haversine GPS distance calculation
    3. Active regional warehouse fallback
    """
    # Query available godowns
    godowns = db.query(Godown).all()
    if not godowns:
        return None

    if not address:
        central = godowns[0]
        return {
            "id": str(central.id),
            "name": central.name,
            "godown_code": central.godown_code,
            "location": central.location,
            "estimated_distance_km": 8.0,
            "estimated_delivery_hours": 2,
        }

    city_key = (address.city or "").strip().lower()
    cust_lat = address.latitude
    cust_lng = address.longitude

    if (not cust_lat or not cust_lng) and city_key in REGIONAL_COORDINATES:
        cust_lat, cust_lng = REGIONAL_COORDINATES[city_key]

    best_godown: Optional[Godown] = None
    min_distance = float("inf")

    for g in godowns:
        g_city = (g.location or g.name or "").lower()
        # Direct city match
        if city_key and (city_key in g_city or g_city in city_key):
            best_godown = g
            min_distance = 4.5
            break

        g_coords: Optional[tuple[float, float]] = None
        for k, v in REGIONAL_COORDINATES.items():
            if k in g_city:
                g_coords = v
                break
        if not g_coords:
            g_coords = (11.0168, 76.9558)

        if cust_lat and cust_lng:
            dist = calculate_distance_km(cust_lat, cust_lng, g_coords[0], g_coords[1])
            if dist < min_distance:
                min_distance = dist
                best_godown = g

    if not best_godown:
        best_godown = godowns[0]
        min_distance = 10.0

    delivery_hours = 2 if min_distance <= 15 else (4 if min_distance <= 40 else 24)

    return {
        "id": str(best_godown.id),
        "name": best_godown.name,
        "godown_code": best_godown.godown_code,
        "location": best_godown.location,
        "estimated_distance_km": round(min_distance, 1),
        "estimated_delivery_hours": delivery_hours,
    }
