import { useState } from 'react'
import { useApp } from '../App'
import { Logo } from '../components/Logo'
import { LANG_LABELS } from '../translations'

const SIDE_IMAGE = 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&h=1200&fit=crop&auto=format'

interface LoginProps {
  isExpert?: boolean
}

export function Login({ isExpert = false }: LoginProps) {
  const { t, setView, lang, setLang } = useApp()
  const [step, setStep] = useState<'language' | 'auth'>('language')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')
  const [langOpen, setLangOpen] = useState(false)

  const handleSignIn = () => {
    if (isExpert) {
      setView('expert')
    } else {
      setView('dashboard')
    }
  }

  const LANG_OPTIONS: { code: typeof lang; label: string; sub: string; flag: string }[] = [
    { code: 'en', label: 'English', sub: 'English', flag: '🇬🇧' },
    { code: 'te', label: 'తెలుగు', sub: 'Telugu', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', sub: 'Tamil', flag: '🇮🇳' },
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi', flag: '🇮🇳' },
  ]

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Left panel — image */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
        <div className="absolute inset-0 bg-forest">
          <img
            src={SIDE_IMAGE}
            alt="Woman harvesting rice in a lush green paddy field"
            className="w-full h-full object-cover object-top"
            style={{ opacity: 0.65 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(31,77,47,0.4) 0%, rgba(26,46,30,0.75) 100%)',
            }}
          />
        </div>
        {/* Quote overlay */}
        <div className="relative z-10 flex flex-col justify-end p-10">
          <blockquote className="text-cream">
            <p className="font-display text-2xl leading-snug mb-3">
              "Understand your farm.<br />Know what to do next."
            </p>
            <footer className="text-cream/50 text-sm font-mono tracking-wide">
              — FarmAssist AI
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo + nav */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setView('landing')}>
              <Logo size={28} />
            </button>
          </div>

          {/* Expert badge */}
          {isExpert && (
            <div className="mb-6 inline-flex items-center gap-2 bg-rain/10 text-rain text-xs font-mono rounded-full px-3 py-1.5 border border-rain/20">
              <span>◈</span>
              Agricultural Expert Portal
            </div>
          )}

          {step === 'language' ? (
            /* STEP 1: PROMINENT LANGUAGE SELECTION */
            <div className="space-y-6 step-in">
              <div>
                <div className="inline-block text-xs font-semibold uppercase tracking-wider text-leaf bg-leaf/10 px-2.5 py-1 rounded-md mb-2">
                  Step 1 of 2
                </div>
                <h1 className="font-display text-2xl text-charcoal font-bold mb-1">
                  Choose Your Preferred Language
                </h1>
                <p className="text-sage text-sm">
                  సభ్యత్వం లేదా సైన్ ఇన్ కోసం మీ భాషను ఎంచుకోండి
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {LANG_OPTIONS.map((opt) => {
                  const isSelected = lang === opt.code
                  return (
                    <button
                      key={opt.code}
                      onClick={() => setLang(opt.code)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-forest bg-forest/8 ring-2 ring-forest/30 shadow-sm'
                          : 'border-pebble bg-white hover:border-sage hover:bg-mist/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.flag}</span>
                        <div>
                          <div className="font-semibold text-charcoal text-base">
                            {opt.label}
                          </div>
                          <div className="text-sage text-xs">
                            {opt.sub}
                          </div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-forest bg-forest text-white' : 'border-pebble'
                      }`}>
                        {isSelected && <span className="text-xs">✓</span>}
                      </div>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep('auth')}
                className="w-full py-3.5 bg-forest text-cream font-semibold rounded-xl hover:bg-leaf transition-colors text-sm shadow-md flex items-center justify-center gap-2"
              >
                <span>Continue to Sign In</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            /* STEP 2: CREDENTIALS SIGN-IN */
            <div className="step-in">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="font-display text-2xl text-charcoal font-bold mb-1">
                    {t('auth_title')}
                  </h1>
                  <p className="text-sage text-xs">{t('auth_sub')}</p>
                </div>
                <button
                  onClick={() => setStep('language')}
                  className="text-xs text-leaf hover:underline font-medium flex items-center gap-1"
                >
                  <span>🌐 {LANG_LABELS[lang].split(' — ')[0]}</span>
                  <span>(Change)</span>
                </button>
              </div>

          {/* Form */}
          <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); handleSignIn() }}
          >
            {!showOtp ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-sage mb-1.5 uppercase tracking-wide">
                    {t('auth_mobile')}
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-sage mb-1.5 uppercase tracking-wide">
                    {t('auth_password')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf transition-all"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-sage hover:text-charcoal transition-colors">
                    {t('auth_forgot')}
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-forest text-cream font-medium rounded-lg hover:bg-leaf transition-colors text-sm"
                >
                  {t('auth_signin')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtp(true)}
                  className="w-full py-3 border border-pebble text-charcoal font-medium rounded-lg hover:bg-mist transition-colors text-sm"
                >
                  {t('auth_otp')}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-sage mb-1.5 uppercase tracking-wide">
                    OTP sent to {mobile || '9876543210'}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-leaf/40 focus:border-leaf transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-forest text-cream font-medium rounded-lg hover:bg-leaf transition-colors text-sm"
                >
                  {t('auth_signin')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtp(false)}
                  className="w-full py-2.5 text-sage hover:text-charcoal text-sm transition-colors"
                >
                  ← Back to password
                </button>
              </>
            )}
          </form>

          {/* Voice option */}
          <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-sage hover:text-charcoal border border-dashed border-pebble rounded-lg hover:border-charcoal/40 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
            {t('auth_voice')}
          </button>

          {/* Footer links */}
          <div className="mt-8 text-center text-sm text-sage">
            {t('auth_register_note')}{' '}
            <button className="text-leaf font-medium hover:text-forest transition-colors">
              {t('auth_create')}
            </button>
          </div>

          {!isExpert && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setView('expert-login')}
                className="text-xs text-sage/60 hover:text-sage transition-colors"
              >
                {t('landing_expert')} →
              </button>
            </div>
          )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
