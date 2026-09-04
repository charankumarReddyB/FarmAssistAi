import { useState } from 'react'
import { useApp } from '../App'
import { LANG_LABELS, type Lang } from '../translations'
import { getApiBaseUrl } from '../lib/api'

type Section = 'profile' | 'farm' | 'language' | 'voice' | 'notifications' | 'accessibility' | 'account'

const SECTIONS: { id: Section; icon: string; label: string }[] = [
  { id: 'profile', icon: '◉', label: 'Personal Details' },
  { id: 'farm', icon: '◈', label: 'Farm Details' },
  { id: 'language', icon: '🌐', label: 'Language & Region' },
  { id: 'voice', icon: '◯', label: 'Voice Preferences' },
  { id: 'notifications', icon: '◐', label: 'Notifications' },
  { id: 'accessibility', icon: '⬡', label: 'Accessibility' },
  { id: 'account', icon: '⬢', label: 'Account & Privacy' },
]

function Field({ label, value, editable = true }: { label: string; value: string; editable?: boolean }) {
  const [val, setVal] = useState(value)
  const [editing, setEditing] = useState(false)
  return (
    <div className="flex items-center justify-between py-3 border-b border-pebble/60 last:border-0 group">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-mono uppercase tracking-wide text-sage mb-0.5">{label}</div>
        {editing ? (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => setEditing(false)}
            className="text-charcoal text-sm border-b border-leaf/50 bg-transparent focus:outline-none w-full font-sans"
          />
        ) : (
          <div className="text-charcoal text-sm font-sans">{val}</div>
        )}
      </div>
      {editable && (
        <button
          onClick={() => setEditing(!editing)}
          className="ml-4 text-xs text-sage hover:text-charcoal opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 cursor-pointer"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      )}
    </div>
  )
}

function Toggle({ label, description, defaultOn = false }: { label: string; description?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between py-3 border-b border-pebble/60 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <div className="text-charcoal text-sm font-medium">{label}</div>
        {description && <div className="text-sage text-xs mt-0.5 leading-snug">{description}</div>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${on ? 'bg-forest' : 'bg-pebble'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  )
}

export function Settings() {
  const { t, lang, setLang, setView, updateUser, user, logout } = useApp()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>('normal')
  const [notifMethod, setNotifMethod] = useState<'sms' | 'app' | 'both'>('both')
  const [locDetecting, setLocDetecting] = useState(false)
  const [locMessage, setLocMessage] = useState<string | null>(null)

  const isFarmer = !user?.role || user?.role === 'farmer'
  const visibleSections = isFarmer
    ? SECTIONS
    : SECTIONS.filter((s) => s.id !== 'farm')

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang)
  }

  const [profileName, setProfileName] = useState(user?.display_name || user?.full_name || 'Farmer User')
  const [profileState, setProfileState] = useState(user?.state || '')
  const [profileDistrict, setProfileDistrict] = useState(user?.district || '')
  const [profileVillage, setProfileVillage] = useState(user?.village_or_city || user?.village || '')

  const handleDetectGPS = async () => {
    setLocDetecting(true)
    setLocMessage('Requesting GPS location from browser...')
    try {
      const coords = await detectBrowserLocation()
      setLocMessage('Reverse geocoding coordinates...')
      const geocoded = await reverseGeocode(coords.latitude, coords.longitude)

      setProfileState(geocoded.state || '')
      setProfileDistrict(geocoded.district || '')
      setProfileVillage(geocoded.village_or_city || '')

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

      setLocMessage(`📍 GPS Location successfully updated: ${geocoded.district || ''}, ${geocoded.state || ''} (${coords.latitude.toFixed(2)}°, ${coords.longitude.toFixed(2)}°)`)
    } catch (err: any) {
      setLocMessage(`❌ ${err.message || 'GPS location detection failed.'}`)
    } finally {
      setLocDetecting(false)
    }
  }

  const handleSaveLocation = async () => {
    const updated = {
      state: profileState.trim() || undefined,
      district: profileDistrict.trim() || undefined,
      village_or_city: profileVillage.trim() || undefined,
      village: profileVillage.trim() || undefined,
      full_name: profileName.trim() || undefined,
      display_name: profileName.trim() || undefined,
      onboarding_completed: true,
    }
    updateUser(updated)

    const token = localStorage.getItem('farmassist_token')
    try {
      await fetch(`${getApiBaseUrl()}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updated)
      })
      setLocMessage(`✅ Location saved: ${profileDistrict || 'Custom'}, ${profileState || ''}. Weather and farm analysis updated!`)
    } catch (e) {
      setLocMessage('Location saved locally.')
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-forest text-cream text-3xl font-medium flex items-center justify-center overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    (profileName || user?.email || 'F')[0].toUpperCase()
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-charcoal">{profileName}</h3>
                <p className="text-xs text-sage font-mono">
                  {user?.email || 'farmer@farmassist.ai'} · Role: <span className="capitalize font-semibold text-leaf">{user?.role || 'Farmer'}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-leaf/10 text-leaf text-xs rounded-md font-semibold">
                  <span>🌐 App Language:</span>
                  <span>{LANG_LABELS[lang]}</span>
                </div>
              </div>
            </div>

            {/* GPS Location & Live Status */}
            <div className="bg-white border border-pebble rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-pebble/40 pb-3">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-sage font-semibold">
                    Farm Location & Geolocation
                  </div>
                  <p className="text-xs text-charcoal/70 mt-0.5">
                    Used for localized weather, climate zones, and soil intelligence.
                  </p>
                </div>
                <button
                  type="button"
                  id="settings-detect-gps-btn"
                  disabled={locDetecting}
                  onClick={handleDetectGPS}
                  className="px-3.5 py-2 bg-forest text-cream font-semibold rounded-lg hover:bg-leaf transition-colors text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>{locDetecting ? 'Detecting...' : 'Detect GPS Location'}</span>
                  <span>🛰</span>
                </button>
              </div>

              {locMessage && (
                <div className="p-3 bg-mist border border-pebble text-xs rounded-lg font-medium text-charcoal">
                  {locMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wide text-sage block mb-1">State</label>
                  <input
                    type="text"
                    id="settings-state"
                    value={profileState}
                    onChange={(e) => setProfileState(e.target.value)}
                    placeholder="e.g. Andhra Pradesh, Tamil Nadu"
                    className="w-full text-sm text-charcoal bg-mist/50 border border-pebble rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono uppercase tracking-wide text-sage block mb-1">District</label>
                  <input
                    type="text"
                    id="settings-district"
                    value={profileDistrict}
                    onChange={(e) => setProfileDistrict(e.target.value)}
                    placeholder="e.g. Kakinada, Chennai"
                    className="w-full text-sm text-charcoal bg-mist/50 border border-pebble rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-mono uppercase tracking-wide text-sage block mb-1">Village / City / Locality</label>
                  <input
                    type="text"
                    id="settings-village"
                    value={profileVillage}
                    onChange={(e) => setProfileVillage(e.target.value)}
                    placeholder="e.g. Samalkota, Guindy"
                    className="w-full text-sm text-charcoal bg-mist/50 border border-pebble rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  id="settings-save-location-btn"
                  onClick={handleSaveLocation}
                  className="px-5 py-2.5 bg-forest text-cream font-semibold rounded-lg hover:bg-leaf transition-colors text-sm shadow cursor-pointer"
                >
                  Save Location & Update Weather
                </button>
              </div>
            </div>
          </div>
        )

      case 'farm':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-pebble rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-pebble/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-charcoal">Farm Configuration & Agronomic Baseline</h3>
                  <p className="text-sage text-xs">Used across My Farm, crop suitability, and advisory telemetry.</p>
                </div>
                <button
                  onClick={() => setView('farm')}
                  className="text-xs text-leaf font-semibold hover:underline cursor-pointer"
                >
                  Go to My Farm →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Farm Name</label>
                  <input
                    type="text"
                    value={user?.farm_name || ''}
                    onChange={(e) => updateUser({ farm_name: e.target.value })}
                    placeholder="e.g. Green Valley Farm"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Total Farm Size</label>
                  <input
                    type="text"
                    value={user?.farm_size || ''}
                    onChange={(e) => updateUser({ farm_size: e.target.value })}
                    placeholder="e.g. 4.5 acres"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Current Primary Crop</label>
                  <input
                    type="text"
                    value={user?.current_crop || ''}
                    onChange={(e) => updateUser({ current_crop: e.target.value })}
                    placeholder="e.g. Paddy (Rice), Cotton, Wheat"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Soil Classification</label>
                  <input
                    type="text"
                    value={user?.soil_type || ''}
                    onChange={(e) => updateUser({ soil_type: e.target.value })}
                    placeholder="e.g. Clay Loam, Black Soil, Red Sandy"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Irrigation Method</label>
                  <input
                    type="text"
                    value={user?.irrigation_method || ''}
                    onChange={(e) => updateUser({ irrigation_method: e.target.value })}
                    placeholder="e.g. Drip + Sprinkler, Flood Irrigation"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Sowing Date</label>
                  <input
                    type="text"
                    value={user?.sowing_date || ''}
                    onChange={(e) => updateUser({ sowing_date: e.target.value })}
                    placeholder="e.g. 15 June 2026"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Water Source</label>
                  <input
                    type="text"
                    value={user?.water_source || ''}
                    onChange={(e) => updateUser({ water_source: e.target.value })}
                    placeholder="e.g. Canal + Borewell"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sage uppercase font-mono block mb-1">Survey / Plot Number</label>
                  <input
                    type="text"
                    value={user?.survey_number || ''}
                    onChange={(e) => updateUser({ survey_number: e.target.value })}
                    placeholder="e.g. 142/3B"
                    className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/30 text-charcoal font-medium text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3 font-semibold">Select Application & Advisory Language</div>
              <p className="text-charcoal/70 text-sm mb-4">
                Choosing a language updates all text, advisories, notifications, and global typography across the application.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(Object.entries(LANG_LABELS) as [typeof lang, string][]).map(([code, label]) => {
                  const isSelected = lang === code
                  return (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-forest bg-forest/8 ring-2 ring-forest/30 shadow-sm'
                          : 'border-pebble bg-white hover:border-leaf/40 hover:bg-mist/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-forest bg-forest text-cream' : 'border-pebble'}`}>
                          {isSelected && <span className="block w-2 h-2 bg-white rounded-full" />}
                        </span>
                        <div>
                          <div className={`font-semibold text-base ${isSelected ? 'text-forest' : 'text-charcoal'}`}>
                            {label}
                          </div>
                          <div className="text-sage text-xs font-mono uppercase">{code}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-forest text-cream rounded">
                          ACTIVE
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-pebble">
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3 font-semibold">Advisory Regional Format</div>
              <div className="bg-white border border-pebble rounded-xl px-5 py-1">
                <Field label="Advisory Preferred Language" value={LANG_LABELS[lang]} editable={false} />
                <Field label="Date Format" value="DD/MM/YYYY" />
                <Field label="Unit System" value="Metric (kg, ha, °C)" />
                <Field label="Currency" value="INR (₹)" editable={false} />
              </div>
            </div>
          </div>
        )

      case 'voice':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-pebble rounded-xl px-5 py-1">
              <Toggle label="Enable Voice Assistant" description="Use voice to navigate and ask questions" defaultOn={true} />
              <Toggle label="Read advisories aloud" description="Auto-play audio for farm advisories" defaultOn={true} />
              <Toggle label="Voice navigation" description="Control app navigation with voice commands" defaultOn={false} />
              <Toggle label="Confirm before executing commands" description="Always show confirmation before voice-triggered actions" defaultOn={true} />
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">Voice Language</div>
              <div className="bg-white border border-pebble rounded-xl px-5 py-1">
                <Field label="Voice Input Language" value={LANG_LABELS[lang]} />
                <Field label="Voice Response Language" value={LANG_LABELS[lang]} />
                <Field label="Speech Speed" value="Normal" />
              </div>
            </div>

            <button
              onClick={() => setView('voice')}
              className="w-full py-3 border border-leaf/30 text-leaf rounded-xl text-sm font-medium hover:bg-leaf/8 transition-colors cursor-pointer"
            >
              Open Voice Assistant →
            </button>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">Delivery Method</div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['sms', 'app', 'both'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setNotifMethod(m)}
                    className={`py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      notifMethod === m
                        ? 'border-forest bg-forest text-cream'
                        : 'border-pebble text-charcoal hover:border-leaf/40'
                    }`}
                  >
                    {m === 'sms' ? 'SMS' : m === 'app' ? 'App Only' : 'SMS + App'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-pebble rounded-xl px-5 py-1">
              <Toggle label="High-risk crop alerts" description="Immediate notification for disease detection" defaultOn={true} />
              <Toggle label="Weather alerts" description="Rain, drought, or frost warnings" defaultOn={true} />
              <Toggle label="Soil report analyzed" description="When AI completes your soil analysis" defaultOn={true} />
              <Toggle label="Advisory updates" description="Weekly personalized farm advisories" defaultOn={true} />
              <Toggle label="Expert review completed" description="When an expert reviews your report" defaultOn={true} />
              <Toggle label="Irrigation reminders" description="Daily irrigation schedule reminders" defaultOn={false} />
            </div>
          </div>
        )

      case 'accessibility':
        return (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">Text Size</div>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'large', 'xl'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setTextSize(size)}
                    className={`py-3 rounded-xl border text-center transition-all cursor-pointer ${
                      textSize === size
                        ? 'border-forest bg-forest text-cream'
                        : 'border-pebble bg-white text-charcoal hover:border-leaf/40'
                    }`}
                  >
                    <div className={`font-medium ${size === 'normal' ? 'text-sm' : size === 'large' ? 'text-base' : 'text-lg'}`}>
                      Aa
                    </div>
                    <div className="text-xs mt-0.5 opacity-70">
                      {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-pebble rounded-xl px-5 py-1">
              <Toggle label="High contrast mode" description="Increase contrast for better readability" defaultOn={false} />
              <Toggle label="Reduce animations" description="Turn off motion for improved accessibility" defaultOn={false} />
              <Toggle label="Large touch targets" description="Increase tap area for buttons and links" defaultOn={true} />
            </div>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-pebble rounded-xl px-5 py-1">
              <Toggle label="Share anonymized data" description="Help improve AI recommendations for all farmers" defaultOn={true} />
              <Toggle label="Expert review opt-in" description="Allow agricultural experts to review your reports" defaultOn={true} />
            </div>

            <div className="pt-2 border-t border-pebble">
              <button
                id="settings-signout-btn"
                onClick={() => logout()}
                className="w-full py-3 border border-risk/30 text-risk rounded-xl text-sm font-medium hover:bg-risk/5 transition-colors cursor-pointer"
              >
                Sign Out of FarmAssist AI
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-screen-lg mx-auto font-sans space-y-4">
      {/* Return to Admin/Expert console banner */}
      {user?.role === 'admin' ? (
        <div className="flex items-center justify-between bg-forest text-cream px-5 py-3 rounded-2xl shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-rain font-semibold">Administrator Account</div>
            <div className="text-sm font-bold text-cream">System & Profile Preferences</div>
          </div>
          <button
            onClick={() => setView('admin')}
            className="text-xs bg-leaf hover:bg-forest text-cream font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer border border-white/20 shadow-sm"
          >
            ← Back to Admin Console
          </button>
        </div>
      ) : user?.role === 'expert' ? (
        <div className="flex items-center justify-between bg-forest text-cream px-5 py-3 rounded-2xl shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-rain font-semibold">Agricultural Expert Account</div>
            <div className="text-sm font-bold text-cream">Expert Profile & Preferences</div>
          </div>
          <button
            onClick={() => setView('expert')}
            className="text-xs bg-leaf hover:bg-forest text-cream font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer border border-white/20 shadow-sm"
          >
            ← Back to Expert Portal
          </button>
        </div>
      ) : null}

      <div className="mb-4">
        <h1 className="font-display text-3xl text-charcoal">{t('nav_settings')}</h1>
        <p className="text-sage text-sm mt-1">Manage your profile, preferences, and language settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-0.5">
            {visibleSections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-forest text-cream font-medium'
                    : 'text-sage hover:bg-mist hover:text-charcoal'
                }`}
              >
                <span className="opacity-70 text-base">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Section content */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <h2 className="font-display text-xl text-charcoal">
              {visibleSections.find((s) => s.id === activeSection)?.label || 'Settings'}
            </h2>
          </div>
          {renderSection()}
        </div>
      </div>
    </div>
  )
}
