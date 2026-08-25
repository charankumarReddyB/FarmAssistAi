import logging
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.weather_service import weather_service
from app.models.user import User
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["Live Location Weather"])


@router.get("", summary="Get live weather forecast for farmer's location")
def get_location_weather(
    location: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns live weather forecast (temperature, humidity, wind speed, rain probability)
    for the user's specific location, powered by Open-Meteo API.
    """
    target_lat = latitude if latitude is not None else lat
    target_lon = longitude if longitude is not None else lon
    target_loc = location

    if target_lat is None and target_lon is None and current_user:
        target_lat = current_user.latitude
        target_lon = current_user.longitude
        if not target_loc and current_user.district and current_user.state:
            target_loc = f"{current_user.district}, {current_user.state}"

    if target_lat is None and target_lon is None and not target_loc:
        return {
            "location_configured": False,
            "location": "Location Not Configured",
            "temperature": None,
            "humidity": None,
            "wind_speed": None,
            "rain_probability": None,
            "condition": "Unknown",
            "farm_impact": "Please enable location access or enter your location in Settings to view local weather and farming recommendations.",
            "source": "unconfigured"
        }

    return weather_service.get_weather(location=target_loc or "Detected Location", lat=target_lat, lon=target_lon)
