import logging
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.weather_service import weather_service
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["Live Location Weather"])


@router.get("", summary="Get live weather forecast for farmer's location")
def get_location_weather(
    location: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Returns live weather forecast (temperature, humidity, wind speed, rain probability)
    for the farmer's location, powered by Open-Meteo API.
    """
    if not location and lat is None and lon is None:
        user = db.query(User).first()
        if user and user.district and user.state:
            location = f"{user.district}, {user.state}"
            lat = user.latitude
            lon = user.longitude

    if not location:
        location = "Kakinada, Andhra Pradesh"

    return weather_service.get_weather(location=location, lat=lat, lon=lon)
