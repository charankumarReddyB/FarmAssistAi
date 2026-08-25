/**
 * Geolocation & Reverse Geocoding Utility for FarmAssist AI
 */

export interface GeocodedLocation {
  country?: string
  state?: string
  district?: string
  village_or_city?: string
  latitude: number
  longitude: number
}

export async function detectBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        let msg = 'Unable to retrieve your location.'
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access or enter manually.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.'
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.'
        }
        reject(new Error(msg))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  })
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation> {
  let country = 'India'
  let state = ''
  let district = ''
  let village_or_city = ''

  // 1. Try BigDataCloud Reverse Geocoding API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (res.ok) {
      const data = await res.json()
      country = data.countryName || country
      state = data.principalSubdivision || state
      district = data.locality || data.city || data.county || district
      village_or_city = data.locality || data.city || village_or_city
    }
  } catch (e) {
    // fallback to nominatim
  }

  // 2. Fallback to OpenStreetMap Nominatim
  if (!state || !district) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: AbortSignal.timeout(4000),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const addr = data.address || {}
        country = addr.country || country
        state = addr.state || addr.region || state
        district = addr.state_district || addr.county || addr.district || addr.city || district
        village_or_city = addr.village || addr.town || addr.suburb || addr.city || addr.hamlet || village_or_city
      }
    } catch (e) {
      // pass
    }
  }

  return {
    latitude: lat,
    longitude: lon,
    country: country || undefined,
    state: state || undefined,
    district: district || undefined,
    village_or_city: village_or_city || undefined,
  }
}
