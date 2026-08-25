import { useState } from 'react'
import { useApp } from '../App'
import { LANG_LABELS, type Lang } from '../translations'

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
  const { t, lang, setLang, setView, updateUser } = useApp()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>('normal')
  const [notifMethod, setNotifMethod] = useState<'sms' | 'app' | 'both'>('both')

  const handleLanguageChange = (newLang: Lang) => {
    setLang(newLang)
  }

  const [profileState, setProfileState] = useState(() => {
    const raw = localStorage.getItem('farmassist_user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        return u.state || 'Andhra Pradesh'
      } catch (e) {}
    }
    return 'Andhra Pradesh'
  })

  const [profileDistrict, setProfileDistrict] = useState(() => {
    const raw = localStorage.getItem('farmassist_user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        return u.district || 'Kakinada'
      } catch (e) {}
    }
    return 'Kakinada'
  })

  const [profileVillage, setProfileVillage] = useState('Samalkota')

  const handleSaveLocation = () => {
    const updated = {
      state: profileState,
      district: profileDistrict,
      village: profileVillage,
      location: `${profileDistrict}, ${profileState}`
    }
    updateUser(updated)

    fetch('http://127.0.0.1:8000/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {})

    alert(`Location saved: ${profileDistrict}, ${profileState}. Farm analysis updated!`)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-forest text-cream text-3xl font-medium flex items-center justify-center">
                  R
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-leaf text-cream rounded-full flex items-center justify-center text-xs shadow hover:bg-forest transition-colors cursor-pointer">
                  ✎
                </button>
              </div>
              <div>
                <h3 className="text-xl font-bold text-charcoal">Raju Reddy</h3>
                <p className="text-xs text-sage font-mono">Farmer ID: farmer_001 · {profileDistrict}, {profileState}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-leaf/10 text-leaf text-xs rounded-md font-semibold">
                  <span>🌐 App Language:</span>
                  <span>{LANG_LABELS[lang]}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-pebble rounded-xl px-5 py-4 space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-sage border-b border-pebble/40 pb-2 font-semibold">
                Farmer & Location Profile
              </div>
              <Field label="Full Name" value="Raju Reddy" />
              <Field label="Mobile Number" value="+91 9876543210" />

              <div className="py-2 border-b border-pebble/60">
                <label className="text-xs font-mono uppercase tracking-wide text-sage block mb-1">State</label>
                <select
                  value={profileState}
                  onChange={(e) => setProfileState(e.target.value)}
                  className="w-full text-sm text-charcoal bg-mist/50 border border-pebble rounded-lg p-2 focus:outline-none"
                >
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                </select>
              </div>

              <div className="py-2 border-b border-pebble/60">
                <label className="text-xs font-mono uppercase tracking-wide text-sage block mb-1">District / City</label>
                <input
                  type="text"
                  value={profileDistrict}
                  onChange={(e) => setProfileDistrict(e.target.value)}
                  placeholder="e.g. Kakinada or Chennai"
                  className="w-full text-sm text-charcoal bg-mist/50 border border-pebble rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="py-2 border-b border-pebble/60">
                <label className="text-xs font-mono uppercase tracking-wide text-sage block mb-1">Village / Town</label>
                <input
                  type="text"
                  value={profileVillage}
                  onChange={(e) => setProfileVillage(e.target.value)}
                  className="w-full text-sm text-charcoal bg-mist/50 border border-pebble rounded-lg p-2 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-mist/60 border border-pebble rounded-xl p-4 flex items-center justify-between text-xs text-sage">
              <span>📍 Changing location automatically updates live weather, climate context, soil baselines, and crop recommendations.</span>
              <button
                onClick={handleSaveLocation}
                className="px-4 py-2 bg-forest text-cream font-semibold rounded-lg hover:bg-leaf transition-colors flex-shrink-0 ml-3 cursor-pointer"
              >
                Save Location
              </button>
            </div>
          </div>
        )

      case 'farm':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-pebble rounded-xl px-5 py-1">
              <Field label="Farm Name" value="Reddy Agri Farm" />
              <Field label="Total Area" value="4.2 acres" />
              <Field label="Survey Number" value="142/3B, 142/3C" />
              <Field label="Current Crop" value="Paddy (Kharif 2026)" />
              <Field label="Soil Type" value="Clay Loam" />
              <Field label="Irrigation Method" value="Drip + Sprinkler" />
              <Field label="Water Source" value="Canal + Borewell" />
              <Field label="Sowing Date" value="15 June 2026" />
            </div>
            <button
              onClick={() => setView('farm')}
              className="text-sm text-leaf hover:text-forest transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              View full farm profile →
            </button>
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
                onClick={() => setView('landing')}
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
    <div className="p-6 max-w-screen-lg mx-auto font-sans">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal">{t('nav_settings')}</h1>
        <p className="text-sage text-sm mt-1">Manage your profile, preferences, and language settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
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
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h2>
          </div>
          {renderSection()}
        </div>
      </div>
    </div>
  )
}
