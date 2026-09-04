import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { AiBadge } from '../components/StatusBadge'
import { FarmIntelligence, type FarmIntelligenceData } from '../components/FarmIntelligence'
import { detectBrowserLocation, reverseGeocode } from '../lib/location'
import { apiRequest, getApiBaseUrl } from '../lib/api'


const FORECAST = [
  { day: 'Today', icon: '⛅', temp: '32°', rain: '12%', active: true },
  { day: 'Tue', icon: '🌧', temp: '28°', rain: '78%', active: false },
  { day: 'Wed', icon: '🌦', temp: '30°', rain: '45%', active: false },
  { day: 'Thu', icon: '☀', temp: '33°', rain: '5%', active: false },
  { day: 'Fri', icon: '☀', temp: '34°', rain: '3%', active: false },
]

const HEALTH_ITEMS = [
  {
    key: 'health_soil',
    status: 'needs_attention',
    statusKey: 'health_needs_attention',
    score: 72,
    detail: 'Nitrogen deficiency detected',
    navKey: 'soil' as const,
  },
  {
    key: 'health_crop',
    status: 'good',
    statusKey: 'health_good',
    score: 84,
    detail: 'No spreading disease detected',
    navKey: 'crop' as const,
  },
  {
    key: 'health_weather',
    status: 'moderate',
    statusKey: 'health_moderate',
    score: 65,
    detail: 'Rain tomorrow — low irrigation risk',
    navKey: 'dashboard' as const,
  },
  {
    key: 'health_water',
    status: 'good',
    statusKey: 'health_good',
    score: 88,
    detail: 'Soil moisture within range',
    navKey: 'soil' as const,
  },
  {
    key: 'health_risk',
    status: 'moderate',
    statusKey: 'health_moderate',
    score: 55,
    detail: 'Soil and crop issues need action',
    navKey: 'advisory' as const,
  },
]

const STATUS_TEXT: Record<string, string> = {
  needs_attention: 'text-risk',
  good: 'text-meadow',
  moderate: 'text-harvest',
}

type FarmerView = 'dashboard' | 'soil' | 'crop' | 'advisory' | 'voice' | 'farm' | 'reports' | 'alerts'

function ScoreRing({ score, status }: { score: number; status: string }) {
  const circumference = 2 * Math.PI * 20
  const strokeDash = (score / 100) * circumference
  const color =
    status === 'good' ? '#2d6a4f' : status === 'moderate' ? '#c97a18' : '#a33320'

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r="20" fill="none" stroke="#ede8e0" strokeWidth="4" />
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumference}`}
      />
    </svg>
  )
}

export function Dashboard() {
  const { t, lang, user, setView, updateUser } = useApp()
  const [weatherData, setWeatherData] = useState<{
    location_configured?: boolean
    location: string
    temperature: number | null
    humidity: number | null
    wind_speed: number | null
    rain_probability: number | null
    condition: string
    farm_impact: string
    source?: string
  }>({
    location_configured: false,
    location: 'Location Not Set',
    temperature: null,
    humidity: null,
    wind_speed: null,
    rain_probability: null,
    condition: 'Unknown',
    farm_impact: 'Configure your location to receive localized weather and crop recommendations.',
    source: 'unconfigured'
  })

  const [userProfile, setUserProfile] = useState<{
    name: string
    location: string
    hasLocation: boolean
  }>({
    name: user?.display_name || user?.full_name?.split(' ')[0] || 'Farmer',
    location: 'Location Not Set',
    hasLocation: false,
  })

  const [locAnalysis, setLocAnalysis] = useState<FarmIntelligenceData | null>(null)
  const [locLoading, setLocLoading] = useState<boolean>(true)
  const [detectingLoc, setDetectingLoc] = useState(false)

  const handleQuickEnableLocation = async () => {
    setDetectingLoc(true)
    try {
      const coords = await detectBrowserLocation()
      const geocoded = await reverseGeocode(coords.latitude, coords.longitude)

      const updated = {
        state: geocoded.state,
        district: geocoded.district,
        village_or_city: geocoded.village_or_city,
        village: geocoded.village_or_city,
        latitude: coords.latitude,
        longitude: coords.longitude,
        country: geocoded.country,
        onboarding_completed: true,
      }

      updateUser(updated)

      const token = localStorage.getItem('farmassist_token')
      await fetch(`${getApiBaseUrl()}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updated)
      })
    } catch (err: any) {
      alert(err.message || 'Could not detect location. Please set it in Settings.')
      setView('settings')
    } finally {
      setDetectingLoc(false)
    }
  }

  useEffect(() => {
    const hasLoc = Boolean(user?.district || user?.state || (user?.latitude !== undefined && user?.latitude !== null))
    const dist = user?.district || ''
    const st = user?.state || ''
    const nameStr = user?.display_name || user?.full_name || 'Farmer'

    const locString = dist && st ? `${dist}, ${st}` : dist || st || 'Location Not Set'

    setUserProfile({
      name: nameStr.split(' ')[0],
      location: locString,
      hasLocation: hasLoc,
    })

    if (!hasLoc) {
      setWeatherData({
        location_configured: false,
        location: 'Location Not Set',
        temperature: null,
        humidity: null,
        wind_speed: null,
        rain_probability: null,
        condition: 'Unknown',
        farm_impact: 'Configure your location in Settings or enable GPS to receive live weather and regional crop recommendations.',
        source: 'unconfigured'
      })
      setLocAnalysis(null)
      setLocLoading(false)
      return
    }

    setLocLoading(true)

    // Build query params
    const weatherQuery = user?.latitude !== undefined && user?.latitude !== null && user?.longitude !== undefined && user?.longitude !== null
      ? `latitude=${user.latitude}&longitude=${user.longitude}`
      : dist
      ? `location=${encodeURIComponent(locString)}`
      : ''

    // Fetch dynamic weather from API
    apiRequest(`/weather?${weatherQuery}`)
      .then((data) => {
        if (data && data.temperature !== undefined && data.temperature !== null) {
          setWeatherData({
            location_configured: true,
            location: data.location || locString,
            temperature: data.temperature,
            humidity: data.humidity || 74,
            wind_speed: data.wind_speed || 12,
            rain_probability: data.rain_probability || 12,
            condition: data.condition || 'Partly Cloudy',
            farm_impact: data.farm_impact || 'Weather is favorable for standard farming activities.',
            source: data.source || 'live_open_meteo'
          })
        }
      })
      .catch(() => {})

    // Fetch Location-Based Farm Analysis API
    const farmQuery = user?.latitude !== undefined && user?.latitude !== null
      ? `lat=${user.latitude}&lon=${user.longitude}&state=${encodeURIComponent(st)}&district=${encodeURIComponent(dist)}&language=${encodeURIComponent(lang)}`
      : `state=${encodeURIComponent(st)}&district=${encodeURIComponent(dist)}&language=${encodeURIComponent(lang)}`

    apiRequest(`/farm/location-analysis?${farmQuery}`)
      .then((data) => {
        if (data) {
          setLocAnalysis(data)
        }
      })
      .catch(() => {})
      .finally(() => setLocLoading(false))
  }, [lang, user?.district, user?.state, user?.latitude, user?.longitude])

  const overallScore = Math.round(
    HEALTH_ITEMS.reduce((sum, h) => sum + h.score, 0) / HEALTH_ITEMS.length
  )

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Greeting header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sage text-sm font-mono mb-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1 className="font-display text-3xl text-charcoal">
            {t('dash_greeting')}, {userProfile.name}
          </h1>
          <p className="text-sage text-sm mt-1 flex flex-wrap items-center gap-2">
            <span>📍</span>
            <span>{userProfile.location}</span>
            <button
              type="button"
              onClick={handleQuickEnableLocation}
              disabled={detectingLoc}
              className="text-xs bg-leaf/10 text-leaf hover:bg-leaf hover:text-white px-2 py-0.5 rounded-full border border-leaf/30 transition flex items-center gap-1 cursor-pointer"
            >
              <span>{detectingLoc ? '📡 Detecting...' : (userProfile.hasLocation ? '🔄 Update GPS' : '📍 Auto-detect GPS')}</span>
            </button>
            <span className="text-pebble">·</span>
            <span>🌾 {user?.current_crop || t('dash_current_crop')}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <AiBadge label={t('dash_ai_label')} />
          <AiBadge verified label={t('dash_expert_verified')} />
        </div>
      </div>

      {/* Top summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('health_farm_health'), value: `${overallScore}/100`, sub: t('health_moderate'), color: 'text-harvest', nav: 'advisory' as FarmerView },
          { label: t('health_soil_score'), value: '72/100', sub: t('health_needs_attention'), color: 'text-risk', nav: 'soil' as FarmerView },
          { label: t('health_crop_health'), value: '84/100', sub: t('health_good'), color: 'text-meadow', nav: 'crop' as FarmerView },
          { label: t('health_active_alerts'), value: '3', sub: `1 ${t('alerts_high').toLowerCase()}`, color: 'text-harvest', nav: 'alerts' as FarmerView },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setView(s.nav)}
            className="bg-white border border-pebble rounded-xl p-4 text-left hover:border-leaf/40 transition-colors group cursor-pointer"
          >
            <div className="text-sage text-xs font-mono uppercase tracking-wide mb-1">{s.label}</div>
            <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
            <div className="text-sage text-xs mt-0.5">{s.sub}</div>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Weather module */}
          {!weatherData.location_configured ? (
            <div className="bg-forest text-cream rounded-2xl overflow-hidden shadow-sm border border-forest/30 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-semibold mb-2">
                    <span>📍</span>
                    <span>Location Not Configured</span>
                  </div>
                  <h3 className="font-display text-xl text-cream font-bold">
                    Local Weather & Climate Intel Inactive
                  </h3>
                  <p className="text-cream/70 text-sm max-w-lg mt-1 leading-relaxed">
                    Live weather forecasting, rain alerts, and regional crop advisories require location access or your district selection.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    id="dash-enable-location-btn"
                    disabled={detectingLoc}
                    onClick={handleQuickEnableLocation}
                    className="px-4 py-2.5 bg-leaf hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{detectingLoc ? 'Detecting...' : 'Enable Location'}</span>
                    <span>🛰</span>
                  </button>
                  <button
                    type="button"
                    id="dash-settings-loc-btn"
                    onClick={() => setView('settings')}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-cream font-semibold rounded-xl text-sm transition-colors border border-white/20 cursor-pointer"
                  >
                    Set in Settings
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-forest text-cream rounded-2xl overflow-hidden shadow-sm border border-forest/30">
              {/* Top row */}
              <div className="px-6 pt-5 pb-4 flex items-start justify-between">
                <div>
                  <div className="text-cream/60 text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span>📍</span>
                    <span>{weatherData.location}</span>
                    {weatherData.source === 'live_open_meteo' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                        {t('badge_live_weather')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/30 text-amber-300 border border-amber-400/40">
                        {t('badge_estimated_baseline')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-4">
                    <div>
                      <span className="font-display text-6xl text-cream leading-none">
                        {weatherData.temperature !== null ? Math.round(weatherData.temperature) : '--'}°
                      </span>
                      <span className="text-cream/60 text-lg ml-1">C</span>
                    </div>
                    <div className="pb-1.5">
                      <div className="text-cream font-medium text-lg leading-tight">{weatherData.condition}</div>
                      <div className="text-cream/50 text-sm">
                        {t('weather_feels_like')}{' '}
                        {weatherData.temperature !== null ? Math.round(weatherData.temperature + 2) : '--'}° ·{' '}
                        {weatherData.source === 'live_open_meteo' ? t('weather_live_forecast') : t('status_live_weather_unavailable')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2 mt-1">
                  <div className="flex items-center gap-2 text-sm text-cream/70 justify-end">
                    <span>💧</span>
                    <span className="text-cream/50">{t('weather_humidity')}</span>
                    <span className="text-cream font-mono font-semibold">{weatherData.humidity ?? '--'}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cream/70 justify-end">
                    <span>💨</span>
                    <span className="text-cream/50">{t('weather_wind')}</span>
                    <span className="text-cream font-mono font-semibold">{weatherData.wind_speed ?? '--'} km/h</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-cream/70 justify-end">
                    <span>🌧</span>
                    <span className="text-cream/50">{t('weather_rain')}</span>
                    <span className="text-cream font-mono font-semibold">{weatherData.rain_probability ?? '--'}%</span>
                  </div>
                </div>
              </div>

              {/* Forecast strip */}
              <div className="px-4 pb-4 flex gap-2">
                {FORECAST.map((f) => (
                  <div
                    key={f.day}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl text-center transition-colors ${
                      f.active ? 'bg-white/15' : 'bg-white/6 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-cream/55 text-xs font-mono">{f.day}</span>
                    <span className="text-xl leading-none">{f.icon}</span>
                    <span className="text-cream font-mono font-semibold text-sm">
                      {f.day === 'Today'
                        ? weatherData.temperature !== null
                          ? `${Math.round(weatherData.temperature)}°`
                          : '--°'
                        : f.temp}
                    </span>
                    <span
                      className={`text-xs font-mono ${
                        f.day === 'Today'
                          ? (weatherData.rain_probability ?? 0) > 50
                            ? 'text-sky-300'
                            : 'text-cream/40'
                          : parseFloat(f.rain) > 50
                          ? 'text-sky-300'
                          : 'text-cream/40'
                      }`}
                    >
                      {f.day === 'Today' ? `${weatherData.rain_probability ?? 0}%` : f.rain}
                    </span>
                  </div>
                ))}
              </div>

              {/* Farm impact */}
              <div className="bg-black/20 px-6 py-3 flex items-start gap-3">
                <span className="text-harvest text-sm flex-shrink-0 mt-0.5">◉</span>
                <div>
                  <span className="text-cream/50 text-xs font-mono uppercase tracking-widest mr-2">
                    {t('weather_impact')}:
                  </span>
                  <span className="text-cream/90 text-sm">{weatherData.farm_impact}</span>
                </div>
              </div>
            </div>
          )}

          {/* Today's advice */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-charcoal">{t('dash_today_advice')}</h2>
              <button
                onClick={() => setView('advisory')}
                className="text-xs text-leaf hover:text-forest transition-colors font-medium cursor-pointer"
              >
                {t('dash_full_advisory')} →
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  num: '01',
                  section: t('advice_irrigation'),
                  reason: t('advice_rain_reason'),
                  action: t('advice_delay_irrigation'),
                  numBg: 'bg-rain/10 text-rain',
                  border: 'hover:border-rain/40',
                  nav: 'advisory' as FarmerView,
                },
                {
                  num: '02',
                  section: t('advice_soil'),
                  reason: t('advice_nitrogen_reason'),
                  action: t('advice_nitrogen'),
                  numBg: 'bg-harvest/10 text-harvest',
                  border: 'hover:border-harvest/40',
                  nav: 'soil' as FarmerView,
                },
                {
                  num: '03',
                  section: t('advice_crop'),
                  reason: t('advice_disease_reason'),
                  action: t('advice_disease'),
                  numBg: 'bg-risk/8 text-risk',
                  border: 'hover:border-risk/30',
                  nav: 'crop' as FarmerView,
                },
              ].map((card) => (
                <div
                  key={card.num}
                  className={`bg-white border border-pebble rounded-xl p-4 flex items-start gap-4 transition-colors cursor-pointer group ${card.border}`}
                  onClick={() => setView(card.nav)}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 font-mono text-sm font-bold ${card.numBg}`}
                  >
                    {card.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-charcoal">{card.section}</span>
                      <span className="text-sage text-xs">{card.reason}</span>
                    </div>
                    <p className="text-charcoal text-sm font-medium">{card.action}</p>
                  </div>
                  <span className="text-sage text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1 font-mono">
                    {t('advice_view_details')} →
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Location-Based Farm Intelligence Section */}
          <FarmIntelligence data={locAnalysis} loading={locLoading} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div>
            <h2 className="font-display text-xl text-charcoal mb-3">{t('dash_quick_actions')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: '◎',
                  labelKey: 'qa_soil',
                  subKey: 'qa_soil_sub',
                  view: 'soil' as FarmerView,
                  accent: 'group-hover:text-rain',
                  border: 'hover:border-rain/30 hover:bg-rain/4',
                },
                {
                  icon: '⬢',
                  labelKey: 'qa_crop',
                  subKey: 'qa_crop_sub',
                  view: 'crop' as FarmerView,
                  accent: 'group-hover:text-leaf',
                  border: 'hover:border-leaf/30 hover:bg-leaf/4',
                },
                {
                  icon: '◯',
                  labelKey: 'qa_ask',
                  subKey: 'qa_ask_sub',
                  view: 'voice' as FarmerView,
                  accent: 'group-hover:text-harvest',
                  border: 'hover:border-harvest/30 hover:bg-harvest/4',
                },
                {
                  icon: '◐',
                  labelKey: 'qa_advisory',
                  subKey: 'qa_advisory_sub',
                  view: 'advisory' as FarmerView,
                  accent: 'group-hover:text-forest',
                  border: 'hover:border-forest/20 hover:bg-forest/4',
                },
              ].map((action) => (
                <button
                  key={action.labelKey}
                  onClick={() => setView(action.view)}
                  className={`group bg-white border border-pebble rounded-xl p-4 flex flex-col items-start text-left transition-all ${action.border}`}
                >
                  <span className={`text-2xl text-sage mb-2.5 transition-colors ${action.accent}`}>
                    {action.icon}
                  </span>
                  <span className="text-charcoal font-semibold text-sm leading-tight">
                    {t(action.labelKey)}
                  </span>
                  <span className="text-sage text-xs mt-1 leading-snug">
                    {t(action.subKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Farm health snapshot */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl text-charcoal">{t('dash_farm_health')}</h2>
              <button
                onClick={() => setView('advisory')}
                className="text-xs text-sage hover:text-charcoal font-mono transition-colors"
              >
                Risk Analysis →
              </button>
            </div>
            <div className="bg-white border border-pebble rounded-2xl overflow-hidden">
              {HEALTH_ITEMS.map((item, idx) => (
                <button
                  key={item.key}
                  onClick={() => setView(item.navKey as FarmerView)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-mist/60 transition-colors ${
                    idx < HEALTH_ITEMS.length - 1 ? 'border-b border-pebble/60' : ''
                  }`}
                >
                  {/* Score ring */}
                  <div className="relative flex-shrink-0">
                    <ScoreRing score={item.score} status={item.status} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-mono font-bold ${STATUS_TEXT[item.status]}`}>
                        {item.score}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-charcoal text-sm font-medium">{t(item.key)}</div>
                    <div className="text-sage text-xs truncate">{item.detail}</div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-mono ${STATUS_TEXT[item.status]}`}>
                      {t(item.statusKey)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
