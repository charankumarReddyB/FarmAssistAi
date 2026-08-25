import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { apiRequest } from '../lib/api'

const FARM_MAP = 'https://images.unsplash.com/photo-1615829254885-d4bfd5ce700e?w=800&h=400&fit=crop&auto=format'

export function MyFarm() {
  const { t, user, updateUser, lang } = useApp()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  // Local state for farm fields, initial values populated strictly from user
  const [farmName, setFarmName] = useState(user?.farm_name || '')
  const [farmSize, setFarmSize] = useState(user?.farm_size || '3.5 acres')
  const [currentCrop, setCurrentCrop] = useState(user?.current_crop || 'Paddy (Rice)')
  const [soilType, setSoilType] = useState(user?.soil_type || 'Clay Loam')
  const [irrigationMethod, setIrrigationMethod] = useState(user?.irrigation_method || 'Drip & Canal')
  const [sowingDate, setSowingDate] = useState(user?.sowing_date || '15 June 2026')
  const [cropStage, setCropStage] = useState(user?.crop_stage || 'Vegetative Stage (Day 40)')
  const [phone, setPhone] = useState(user?.phone || '')
  const [experienceYears, setExperienceYears] = useState(user?.experience_years || '10+ yrs experience')
  const [waterSource, setWaterSource] = useState(user?.water_source || 'Groundwater & Canal')
  const [surveyNumber, setSurveyNumber] = useState(user?.survey_number || '')

  // Location fields
  const [stateName, setStateName] = useState(user?.state || '')
  const [districtName, setDistrictName] = useState(user?.district || '')
  const [villageName, setVillageName] = useState(user?.village_or_city || user?.village || '')

  // Synchronize state when user changes
  useEffect(() => {
    if (user) {
      setFarmName(user.farm_name || '')
      if (user.farm_size) setFarmSize(user.farm_size)
      if (user.current_crop) setCurrentCrop(user.current_crop)
      if (user.soil_type) setSoilType(user.soil_type)
      if (user.irrigation_method) setIrrigationMethod(user.irrigation_method)
      if (user.sowing_date) setSowingDate(user.sowing_date)
      if (user.crop_stage) setCropStage(user.crop_stage)
      if (user.phone) setPhone(user.phone)
      if (user.experience_years) setExperienceYears(user.experience_years)
      if (user.water_source) setWaterSource(user.water_source)
      if (user.survey_number) setSurveyNumber(user.survey_number)
      if (user.state) setStateName(user.state)
      if (user.district) setDistrictName(user.district)
      if (user.village_or_city || user.village) setVillageName(user.village_or_city || user.village || '')
    }
  }, [user])

  // Fetch live farm profile on mount
  useEffect(() => {
    apiRequest('/farm/profile')
      .then((data) => {
        if (data) {
          if (data.farm_name) setFarmName(data.farm_name)
          if (data.farm_size) setFarmSize(data.farm_size)
          if (data.current_crop) setCurrentCrop(data.current_crop)
          if (data.soil_type) setSoilType(data.soil_type)
          if (data.irrigation_method) setIrrigationMethod(data.irrigation_method)
          if (data.sowing_date) setSowingDate(data.sowing_date)
          if (data.crop_stage) setCropStage(data.crop_stage)
          if (data.phone) setPhone(data.phone)
          if (data.experience_years) setExperienceYears(data.experience_years)
          if (data.water_source) setWaterSource(data.water_source)
          if (data.survey_number) setSurveyNumber(data.survey_number)
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setStatusMsg(null)

    const updated = {
      farm_name: farmName.trim() || undefined,
      farm_size: farmSize.trim() || undefined,
      current_crop: currentCrop.trim() || undefined,
      soil_type: soilType.trim() || undefined,
      irrigation_method: irrigationMethod.trim() || undefined,
      sowing_date: sowingDate.trim() || undefined,
      crop_stage: cropStage.trim() || undefined,
      phone: phone.trim() || undefined,
      experience_years: experienceYears.trim() || undefined,
      water_source: waterSource.trim() || undefined,
      survey_number: surveyNumber.trim() || undefined,
      state: stateName.trim() || undefined,
      district: districtName.trim() || undefined,
      village_or_city: villageName.trim() || undefined,
      village: villageName.trim() || undefined,
    }

    try {
      // 1. Update application context & Supabase
      updateUser(updated)

      // 2. Persist to FastAPI Backend
      await apiRequest('/farm/profile', {
        method: 'PUT',
        body: JSON.stringify(updated),
      })

      setStatusMsg('Farm profile saved and synchronized successfully!')
      setEditing(false)
    } catch (err: any) {
      console.error('[MY_FARM] Save error:', err)
      setStatusMsg(err.message || 'Failed to save farm details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const displayName = user?.full_name || user?.display_name || user?.email?.split('@')[0] || 'Farmer'
  const userInitial = displayName.charAt(0).toUpperCase()
  const displayLocation = districtName && stateName
    ? `${villageName ? `${villageName}, ` : ''}${districtName}, ${stateName}`
    : districtName || stateName || 'Location Not Set'

  const coordinatesDisplay = user?.latitude !== undefined && user?.latitude !== null && user?.longitude !== undefined && user?.longitude !== null
    ? `${user.latitude.toFixed(4)}° N, ${user.longitude.toFixed(4)}° E`
    : 'GPS: Not Configured'

  const langLabelMap: Record<string, string> = {
    en: 'English',
    te: 'Telugu (తెలుగు)',
    ta: 'Tamil (தமிழ்)',
    hi: 'Hindi (हिन्दी)',
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-charcoal font-bold">{t('farm_title')}</h1>
          <p className="text-sage text-xs mt-1">
            Dynamic farm telemetry, soil classification, and regional profile
          </p>
        </div>
        <button
          id="farm-edit-save-btn"
          disabled={saving}
          onClick={() => {
            if (editing) {
              handleSave()
            } else {
              setEditing(true)
              setStatusMsg(null)
            }
          }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
            editing
              ? 'bg-forest text-cream hover:bg-leaf'
              : 'border border-pebble bg-white text-charcoal hover:bg-mist'
          }`}
        >
          {saving ? 'Saving...' : editing ? `✓ ${t('save')}` : `✎ ${t('farm_edit')}`}
        </button>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-medium ${
          statusMsg.includes('success') ? 'bg-forest/10 border border-forest/30 text-forest' : 'bg-risk/10 border border-risk/30 text-risk'
        }`}>
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Map + Details Grid */}
        <div className="lg:col-span-2 space-y-5">
          {/* Farm Aerial Banner with Dynamic Location Overlay */}
          <div className="bg-charcoal rounded-2xl overflow-hidden h-56 relative shadow-sm border border-pebble">
            <img
              src={FARM_MAP}
              alt="Aerial view of green agricultural land"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent flex items-end p-5">
              <div className="bg-charcoal/80 backdrop-blur-md rounded-xl px-4 py-3 text-cream border border-white/10 shadow-lg">
                <div className="text-xs text-cream/70 font-mono uppercase tracking-wider">
                  {farmName || `${displayName}'s Farm`}
                </div>
                <div className="font-semibold text-sm text-cream mt-0.5">{displayLocation}</div>
                <div className="text-cream/60 text-xs font-mono mt-0.5">{coordinatesDisplay}</div>
              </div>
            </div>
          </div>

          {/* Farm details editable grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Farm Size */}
            <div className="bg-white border border-pebble rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-leaf">◈</span>
                <span className="text-xs font-mono text-sage uppercase tracking-wider">{t('farm_size')}</span>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value)}
                  placeholder="e.g. 4.5 acres"
                  className="w-full text-charcoal text-sm font-semibold border-b border-leaf/50 bg-transparent focus:outline-none pb-1"
                />
              ) : (
                <div className="text-charcoal text-sm font-bold">{farmSize}</div>
              )}
            </div>

            {/* Current Crop */}
            <div className="bg-white border border-pebble rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-harvest">🌾</span>
                <span className="text-xs font-mono text-sage uppercase tracking-wider">{t('farm_crop')}</span>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={currentCrop}
                  onChange={(e) => setCurrentCrop(e.target.value)}
                  placeholder="e.g. Paddy (Kharif 2026)"
                  className="w-full text-charcoal text-sm font-semibold border-b border-leaf/50 bg-transparent focus:outline-none pb-1"
                />
              ) : (
                <div className="text-charcoal text-sm font-bold">{currentCrop}</div>
              )}
            </div>

            {/* Soil Type */}
            <div className="bg-white border border-pebble rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-forest">◎</span>
                <span className="text-xs font-mono text-sage uppercase tracking-wider">{t('farm_soil_type')}</span>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  placeholder="e.g. Clay Loam, Black Cotton"
                  className="w-full text-charcoal text-sm font-semibold border-b border-leaf/50 bg-transparent focus:outline-none pb-1"
                />
              ) : (
                <div className="text-charcoal text-sm font-bold">{soilType}</div>
              )}
            </div>

            {/* Irrigation Method */}
            <div className="bg-white border border-pebble rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-rain">💧</span>
                <span className="text-xs font-mono text-sage uppercase tracking-wider">{t('farm_irrigation')}</span>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value)}
                  placeholder="e.g. Drip + Sprinkler"
                  className="w-full text-charcoal text-sm font-semibold border-b border-leaf/50 bg-transparent focus:outline-none pb-1"
                />
              ) : (
                <div className="text-charcoal text-sm font-bold">{irrigationMethod}</div>
              )}
            </div>

            {/* Sowing Date */}
            <div className="bg-white border border-pebble rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-sage">📅</span>
                <span className="text-xs font-mono text-sage uppercase tracking-wider">{t('farm_sowing')}</span>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  placeholder="e.g. 15 June 2026"
                  className="w-full text-charcoal text-sm font-semibold border-b border-leaf/50 bg-transparent focus:outline-none pb-1"
                />
              ) : (
                <div className="text-charcoal text-sm font-bold">{sowingDate}</div>
              )}
            </div>

            {/* Crop Stage */}
            <div className="bg-white border border-pebble rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg text-meadow">🌱</span>
                <span className="text-xs font-mono text-sage uppercase tracking-wider">{t('farm_stage')}</span>
              </div>
              {editing ? (
                <input
                  type="text"
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  placeholder="e.g. Tillering / Flowering"
                  className="w-full text-charcoal text-sm font-semibold border-b border-leaf/50 bg-transparent focus:outline-none pb-1"
                />
              ) : (
                <div className="text-charcoal text-sm font-bold">{cropStage}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right column — Farmer Profile Card & Location Details */}
        <div className="space-y-5">
          {/* Farmer Dynamic Profile Card */}
          <div className="bg-white border border-pebble rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-forest text-cream text-2xl font-bold flex items-center justify-center shadow-inner uppercase overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-charcoal text-base truncate">{displayName}</div>
                <div className="text-sage text-xs capitalize">{user?.role || 'farmer'} · {experienceYears}</div>
                <div className="text-sage text-xs truncate mt-0.5">{phone || user?.email || 'No phone set'}</div>
              </div>
            </div>

            <div className="border-t border-pebble/60 pt-3 space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-sage text-xs">State</span>
                {editing ? (
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="State"
                    className="text-right text-xs font-medium text-charcoal border-b border-leaf/40 bg-transparent focus:outline-none max-w-[140px]"
                  />
                ) : (
                  <span className="text-charcoal font-semibold text-xs">{stateName || 'Not Set'}</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sage text-xs">District</span>
                {editing ? (
                  <input
                    type="text"
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    placeholder="District"
                    className="text-right text-xs font-medium text-charcoal border-b border-leaf/40 bg-transparent focus:outline-none max-w-[140px]"
                  />
                ) : (
                  <span className="text-charcoal font-semibold text-xs">{districtName || 'Not Set'}</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sage text-xs">Village / City</span>
                {editing ? (
                  <input
                    type="text"
                    value={villageName}
                    onChange={(e) => setVillageName(e.target.value)}
                    placeholder="Village"
                    className="text-right text-xs font-medium text-charcoal border-b border-leaf/40 bg-transparent focus:outline-none max-w-[140px]"
                  />
                ) : (
                  <span className="text-charcoal font-semibold text-xs">{villageName || 'Not Set'}</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sage text-xs">Primary Language</span>
                <span className="text-charcoal font-semibold text-xs">{langLabelMap[lang] || 'English'}</span>
              </div>
            </div>
          </div>

          {/* Quick Telemetry & Soil Baseline Card */}
          <div className="bg-white border border-pebble rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-display text-base font-bold text-charcoal">Water & Survey Information</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-pebble/40">
                <span className="text-sage">Water Source</span>
                {editing ? (
                  <input
                    type="text"
                    value={waterSource}
                    onChange={(e) => setWaterSource(e.target.value)}
                    className="text-right font-medium text-charcoal border-b border-leaf/40 bg-transparent focus:outline-none"
                  />
                ) : (
                  <span className="text-charcoal font-semibold">{waterSource}</span>
                )}
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sage">Survey / Plot No.</span>
                {editing ? (
                  <input
                    type="text"
                    value={surveyNumber}
                    onChange={(e) => setSurveyNumber(e.target.value)}
                    placeholder="e.g. 142/3A"
                    className="text-right font-medium text-charcoal border-b border-leaf/40 bg-transparent focus:outline-none"
                  />
                ) : (
                  <span className="text-charcoal font-semibold">{surveyNumber || 'Not specified'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
