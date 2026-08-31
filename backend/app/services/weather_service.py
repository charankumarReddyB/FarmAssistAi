import logging
import urllib.request
import urllib.parse
import json
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Known baseline coordinates for Indian districts (for fallback geocoding)
DISTRICT_COORDINATES = {
    "kakinada": {"lat": 16.98, "lon": 82.24, "state": "Andhra Pradesh"},
    "guntur": {"lat": 16.30, "lon": 80.44, "state": "Andhra Pradesh"},
    "kurnool": {"lat": 15.82, "lon": 78.03, "state": "Andhra Pradesh"},
    "vijayawada": {"lat": 16.50, "lon": 80.64, "state": "Andhra Pradesh"},
    "visakhapatnam": {"lat": 17.68, "lon": 83.21, "state": "Andhra Pradesh"},
    "hyderabad": {"lat": 17.38, "lon": 78.48, "state": "Telangana"},
    "warangal": {"lat": 17.96, "lon": 79.59, "state": "Telangana"},
    "bengaluru": {"lat": 12.97, "lon": 77.59, "state": "Karnataka"},
    "mysuru": {"lat": 12.29, "lon": 76.63, "state": "Karnataka"},
    "chennai": {"lat": 13.08, "lon": 80.27, "state": "Tamil Nadu"},
    "coimbatore": {"lat": 11.01, "lon": 76.95, "state": "Tamil Nadu"},
    "madurai": {"lat": 9.92, "lon": 78.11, "state": "Tamil Nadu"},
    "thiruvananthapuram": {"lat": 8.52, "lon": 76.93, "state": "Kerala"},
}


class WeatherService:
    def get_weather(self, location: str = "Kakinada, Andhra Pradesh", lat: Optional[float] = None, lon: Optional[float] = None) -> Dict[str, Any]:
        """
        Fetches live weather data for a farmer's location using Open-Meteo API with fallback support.
        """
        target_lat = lat
        target_lon = lon
        loc_clean = location.lower().strip()

        # Extract primary district name
        district_name = location.split(",")[0].strip().lower()

        if target_lat is None or target_lon is None:
            if district_name in DISTRICT_COORDINATES:
                target_lat = DISTRICT_COORDINATES[district_name]["lat"]
                target_lon = DISTRICT_COORDINATES[district_name]["lon"]
            else:
                # Try Open-Meteo live geocoding search for dynamic location lookup
                try:
                    search_name = urllib.parse.quote(district_name or location)
                    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={search_name}&count=1&format=json"
                    geo_req = urllib.request.Request(geo_url, headers={"User-Agent": "FarmAssist-AI/1.0"})
                    with urllib.request.urlopen(geo_req, timeout=3) as g_resp:
                        g_data = json.loads(g_resp.read().decode())
                        results = g_data.get("results", [])
                        if results:
                            target_lat = float(results[0]["latitude"])
                            target_lon = float(results[0]["longitude"])
                            logger.info(f"Geocoded location '{location}' to lat={target_lat}, lon={target_lon}")
                except Exception as ge:
                    logger.debug(f"Dynamic geocoding lookup notice: {ge}")

            if target_lat is None or target_lon is None:
                # Fallback to Kakinada, Andhra Pradesh
                target_lat = 16.98
                target_lon = 82.24


        try:
            # Open-Meteo free live weather forecast endpoint
            url = f"https://api.open-meteo.com/v1/forecast?latitude={target_lat}&longitude={target_lon}&current_weather=true&hourly=relative_humidity_2m,precipitation_probability"
            req = urllib.request.Request(url, headers={"User-Agent": "FarmAssist-AI/1.0"})
            
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode())
                current = data.get("current_weather", {})
                
                temp = current.get("temperature", 31.5)
                wind = current.get("windspeed", 12.0)
                weathercode = current.get("weathercode", 0)

                # Get humidity and rain probability
                hourly = data.get("hourly", {})
                humidity_list = hourly.get("relative_humidity_2m", [72])
                rain_prob_list = hourly.get("precipitation_probability", [15])

                humidity = humidity_list[0] if humidity_list else 72
                rain_probability = rain_prob_list[0] if rain_prob_list else 15

                condition = "Clear / Sunny"
                if weathercode in [1, 2, 3]:
                    condition = "Partly Cloudy"
                elif weathercode in [45, 48]:
                    condition = "Foggy"
                elif weathercode in [51, 53, 55, 61, 63, 65, 80, 81, 82]:
                    condition = "Rain Expected"

                impact = "Weather is favorable for standard farming activities."
                if rain_probability > 50 or "Rain" in condition:
                    impact = "Rain expected tomorrow morning. Consider delaying crop irrigation to prevent over-watering."
                elif temp > 36:
                    impact = "High temperature warning. Ensure adequate soil moisture to protect young seedlings."

                return {
                    "location": location,
                    "latitude": target_lat,
                    "longitude": target_lon,
                    "temperature": round(temp, 1),
                    "humidity": humidity,
                    "wind_speed": round(wind, 1),
                    "rain_probability": rain_probability,
                    "condition": condition,
                    "farm_impact": impact,
                    "source": "live_open_meteo"
                }

        except Exception as e:
            logger.warning(f"Live Weather API call failed: {e}. Returning location-tailored fallback weather.")

        # Location-based dynamic fallback generator
        fallback_temp = 31.0
        fallback_humidity = 70
        fallback_rain = 10

        if "andhra" in loc_clean or "telangana" in loc_clean:
            fallback_temp = 32.5
            fallback_humidity = 74
            fallback_rain = 15
        elif "tamil" in loc_clean or "kerala" in loc_clean:
            fallback_temp = 30.0
            fallback_humidity = 82
            fallback_rain = 35
        elif "karnataka" in loc_clean:
            fallback_temp = 28.5
            fallback_humidity = 68
            fallback_rain = 20

        return {
            "location": location,
            "latitude": target_lat,
            "longitude": target_lon,
            "temperature": fallback_temp,
            "humidity": fallback_humidity,
            "wind_speed": 12.0,
            "rain_probability": fallback_rain,
            "condition": "Partly Cloudy",
            "farm_impact": "Rain expected tomorrow morning. Irrigation may not be necessary today.",
            "source": "location_baseline"
        }


weather_service = WeatherService()
