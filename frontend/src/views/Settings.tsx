import { useState } from 'react'
import { useApp } from '../App'
import { LANG_LABELS } from '../translations'

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
            className="text-charcoal text-sm border-b border-leaf/50 bg-transparent focus:outline-none w-full"
          />
        ) : (
          <div className="text-charcoal text-sm">{val}</div>
        )}
      </div>
      {editable && (
        <button
          onClick={() => setEditing(!editing)}
          className="ml-4 text-xs text-sage hover:text-charcoal opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
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
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-forest' : 'bg-pebble'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  )
}

export function Settings() {
  const { t, lang, setLang, setView } = useApp()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>('normal')
  const [notifMethod, setNotifMethod] = useState<'sms' | 'app' | 'both'>('both')

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
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-leaf text-cream rounded-full flex items-center justify-center text-xs shadow hover:bg-forest transition-colors">
                  ✎
            <div className="bg-white border border-pebble rounded-xl px-5 py-3 space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-sage border-b border-pebble/40 pb-2 font-semibold">
                Farmer & Location Profile
              </div>
              <Field label="Full Name" value="Raju Reddy" />
              <Field label="Mobile Number" value="+91 9876543210" />
              <Field label="State" value="Andhra Pradesh" />
              <Field label="District" value="Kakinada" />
              <Field label="City / Town / Village" value="Samalkota" />
              <Field label="Country" value="India" />
              <Field label="Coordinates" value="16.98° N, 82.24° E" />
            </div>

            <div className="bg-mist/60 border border-pebble rounded-xl p-4 flex items-center justify-between text-xs text-sage">
              <span>📍 Changing location automatically updates live weather and dataset-based crop advisories.</span>
              <button
                onClick={() => {
                  const userObj = {
                    name: 'Raju Reddy',
                    country: 'India',
                    state: 'Andhra Pradesh',
                    district: 'Kakinada',
                    village: 'Samalkota',
                    preferred_language: lang
                  }
                  localStorage.setItem('farmassist_user', JSON.stringify(userObj))
                  fetch('http://127.0.0.1:8000/api/user/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userObj)
                  }).catch(() => {})
                  alert('Profile & Location updated successfully!')
                }}
                className="px-3 py-1.5 bg-forest text-cream font-semibold rounded-lg hover:bg-leaf transition-colors flex-shrink-0 ml-3"
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
              className="text-sm text-leaf hover:text-forest transition-colors flex items-center gap-1.5"
            >
              View full farm profile →
            </button>
          </div>
        )

      case 'language':
        return (
          <div className="space-y-6">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">App Language</div>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(LANG_LABELS) as [typeof lang, string][]).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      lang === code
                        ? 'border-forest bg-forest/5'
                        : 'border-pebble bg-white hover:border-leaf/40'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${lang === code ? 'border-forest bg-forest' : 'border-pebble'}`}>
                      {lang === code && <span className="block w-2 h-2 bg-white rounded-full m-0.5" />}
                    </span>
                    <div>
                      <div className={`font-medium text-sm ${lang === code ? 'text-forest' : 'text-charcoal'}`}>
                        {label}
                      </div>
                      <div className="text-sage text-xs">{code.toUpperCase()}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">Advisory Language</div>
              <p className="text-charcoal/70 text-sm mb-3">Your farm advisories will be shown and read aloud in:</p>
              <div className="bg-white border border-pebble rounded-xl px-5 py-1">
                <Field label="Advisory Language" value={LANG_LABELS[lang]} />
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
              className="w-full py-3 border border-leaf/30 text-leaf rounded-xl text-sm font-medium hover:bg-leaf/8 transition-colors"
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
                    className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
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
              <Toggle label="Market price alerts" description="Commodity price updates (coming soon)" defaultOn={false} />
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">Quiet Hours</div>
              <div className="bg-white border border-pebble rounded-xl px-5 py-1">
                <Field label="Do Not Disturb From" value="10:00 PM" />
                <Field label="Do Not Disturb Until" value="6:00 AM" />
              </div>
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
                    className={`py-3 rounded-xl border text-center transition-all ${
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
              <Toggle label="Audio descriptions" description="Describe images and charts aloud" defaultOn={false} />
              <Toggle label="Large touch targets" description="Increase tap area for buttons and links" defaultOn={true} />
              <Toggle label="Screen reader support" description="Optimize for screen readers" defaultOn={false} />
            </div>

            <div className="bg-mist border border-pebble rounded-xl p-4 text-sm text-charcoal/70 leading-relaxed">
              FarmAssist AI is designed for farmers with varying levels of tech experience. All critical actions are also accessible through the voice assistant.
            </div>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-pebble rounded-xl px-5 py-1">
              <Toggle label="Share anonymized data" description="Help improve AI recommendations for all farmers" defaultOn={true} />
              <Toggle label="Expert review opt-in" description="Allow agricultural experts to review your reports" defaultOn={true} />
              <Toggle label="Research participation" description="Participate in agricultural research programs" defaultOn={false} />
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-sage mb-3">Data & Privacy</div>
              <div className="space-y-2">
                {[
                  'Download my data',
                  'Delete soil reports',
                  'Delete crop analysis history',
                  'Privacy policy',
                  'Terms of service',
                ].map((action) => (
                  <button
                    key={action}
                    className="w-full text-left px-4 py-3 bg-white border border-pebble rounded-xl text-sm text-charcoal hover:bg-mist transition-colors flex items-center justify-between"
                  >
                    {action}
                    <span className="text-sage text-xs">→</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-pebble">
              <button
                onClick={() => setView('landing')}
                className="w-full py-3 border border-risk/30 text-risk rounded-xl text-sm font-medium hover:bg-risk/5 transition-colors"
              >
                Sign Out of FarmAssist AI
              </button>
              <button className="w-full py-2.5 text-xs text-sage hover:text-charcoal transition-colors mt-2">
                Delete Account Permanently
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-screen-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal">{t('nav_settings')}</h1>
        <p className="text-sage text-sm mt-1">Manage your profile, preferences, and privacy settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
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
