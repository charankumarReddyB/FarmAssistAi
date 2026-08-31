import { useState } from 'react'
import { useApp } from '../App'
import { Logo } from '../components/Logo'
import { LANG_LABELS, type Lang } from '../translations'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1528693404014-b13ebe6e723e?w=1920&h=1080&fit=crop&auto=format'

export function Landing() {
  const { t, openAuth, lang, setLang, user, setView } = useApp()
  const [langOpen, setLangOpen] = useState(false)

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Hero background image */}
      <div className="absolute inset-0 bg-forest">
        <img
          src={HERO_IMAGE}
          alt="Farmer standing in a lush rice field at dawn"
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.55 }}
        />
        {/* Gradient overlay — darker at bottom for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(31,77,47,0.3) 0%, rgba(31,77,47,0.5) 40%, rgba(26,46,30,0.88) 80%, rgba(26,46,30,0.97) 100%)',
          }}
        />
      </div>

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 pt-6 pb-2">
        <Logo variant="light" size={34} />

        {/* Language selector */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 text-cream/80 hover:text-cream text-sm transition-colors px-3 py-1.5 rounded-full border border-cream/20 hover:border-cream/40 cursor-pointer"
          >
            <span>🌐</span>
            <span>{LANG_LABELS[lang]}</span>
            <span className="text-cream/50 text-xs">{langOpen ? '▲' : '▼'}</span>
          </button>
          {langOpen && (
            <div className="absolute top-full right-0 mt-2 bg-charcoal rounded-lg overflow-hidden shadow-2xl border border-white/10 min-w-36 z-50">
              {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setLangOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer ${
                    lang === code ? 'bg-leaf text-cream font-medium' : 'text-cream/70 hover:bg-white/10 hover:text-cream'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end pb-20 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Tagline */}
          <h1
            className="font-display text-cream leading-tight"
            style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)' }}
          >
            {t('landing_tagline')}
          </h1>

          {/* Supporting copy */}
          <p className="text-cream/70 text-lg leading-relaxed max-w-lg mx-auto">
            {t('landing_sub')}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {user ? (
              <>
                <button
                  id="dashboard-btn"
                  onClick={() => setView(user.role === 'admin' ? 'admin' : user.role === 'expert' ? 'expert' : 'dashboard')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-leaf text-cream font-medium text-base rounded-lg hover:bg-meadow transition-colors shadow-lg cursor-pointer"
                >
                  Go to Dashboard
                </button>
                <button
                  id="my-farm-btn"
                  onClick={() => setView(user.role === 'admin' ? 'admin' : user.role === 'expert' ? 'expert' : 'farm')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-cream/10 text-cream font-medium text-base rounded-lg border border-cream/25 hover:bg-cream/15 transition-colors backdrop-blur-sm cursor-pointer"
                >
                  My Farm
                </button>
              </>
            ) : (
              <>
                <button
                  id="get-started-btn"
                  onClick={() => openAuth('register')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-leaf text-cream font-semibold text-base rounded-lg hover:bg-meadow transition-colors shadow-lg cursor-pointer"
                >
                  {t('landing_cta')}
                </button>
                <button
                  id="sign-in-btn"
                  onClick={() => openAuth('login')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-cream/10 text-cream font-medium text-base rounded-lg border border-cream/25 hover:bg-cream/15 transition-colors backdrop-blur-sm cursor-pointer"
                >
                  {t('landing_signin')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feature strip */}
      <div className="relative z-10 border-t border-cream/10 bg-charcoal/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-8 py-5 flex flex-wrap justify-center gap-x-10 gap-y-3">
          {[
            { icon: '◎', label: 'Soil Analysis' },
            { icon: '⬢', label: 'Crop Health' },
            { icon: '⛅', label: 'Weather Intelligence' },
            { icon: '◯', label: 'Voice in Your Language' },
            { icon: '◐', label: 'Expert Verified' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-cream/55 text-sm">
              <span className="text-leaf opacity-80">{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
