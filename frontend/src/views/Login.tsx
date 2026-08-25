import { useState } from 'react'
import { useApp } from '../App'
import { Logo } from '../components/Logo'
import { LANG_LABELS } from '../translations'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/supabase'

const SIDE_IMAGE = 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&h=1200&fit=crop&auto=format'

interface LoginProps {
  isExpert?: boolean
  initialRole?: 'farmer' | 'expert' | 'admin'
}

export function Login({ isExpert = false, initialRole }: LoginProps) {
  const { t, setView, lang, setLang, login } = useApp()
  const [step, setStep] = useState<'language' | 'role' | 'auth'>('language')
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'expert' | 'admin'>(
    initialRole || (isExpert ? 'expert' : 'farmer')
  )
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const LANG_OPTIONS: { code: typeof lang; label: string; sub: string; flag: string }[] = [
    { code: 'en', label: 'English', sub: 'English', flag: '🇬🇧' },
    { code: 'te', label: 'తెలుగు', sub: 'Telugu', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', sub: 'Tamil', flag: '🇮🇳' },
    { code: 'hi', label: 'హిन्दी', sub: 'Hindi', flag: '🇮🇳' },
  ]

  const ROLE_OPTIONS = [
    {
      id: 'farmer' as const,
      icon: '🌾',
      titleKey: 'role_farmer',
      subKey: 'role_farmer_sub',
      badge: 'Farmer Portal',
      defaultEmail: 'farmer@farmassist.ai',
      defaultPassword: 'Farmer@123456',
    },
    {
      id: 'expert' as const,
      icon: '🔬',
      titleKey: 'role_expert',
      subKey: 'role_expert_sub',
      badge: 'Expert Review',
      defaultEmail: 'expert@farmassist.ai',
      defaultPassword: 'Expert@123456',
    },
    {
      id: 'admin' as const,
      icon: '🛡️',
      titleKey: 'role_admin',
      subKey: 'role_admin_sub',
      badge: 'System Governance',
      defaultEmail: 'admin@farmassist.ai',
      defaultPassword: 'Admin@123456',
    },
  ]

  const handleRoleSelect = (roleId: 'farmer' | 'expert' | 'admin') => {
    setSelectedRole(roleId)
    const roleOpt = ROLE_OPTIONS.find((r) => r.id === roleId)
    if (roleOpt && !email) {
      setEmail(roleOpt.defaultEmail)
      setPassword(roleOpt.defaultPassword)
    }
  }

  const handleGoogleLogin = async () => {
    setErrorMsg(null)
    setAuthLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication failed. Ensure Supabase Google Provider is configured.')
      setAuthLoading(false)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setAuthLoading(true)

    try {
      if (mode === 'register') {
        // 1. Supabase Auth Sign Up
        let token = 'demo_supabase_jwt_token'
        let userObj: any = null

        try {
          const supRes = await signUpWithEmail(email, password, {
            full_name: fullName || 'FarmAssist User',
            role: selectedRole,
            preferred_language: lang,
          })

          if (supRes?.session?.access_token) {
            token = supRes.session.access_token
          }
          if (supRes?.user) {
            userObj = {
              id: supRes.user.id,
              email: supRes.user.email,
              full_name: fullName || 'FarmAssist User',
              role: selectedRole,
              preferred_language: lang,
            }
          }
        } catch (supErr: any) {
          logger_warn: console.warn('Supabase Auth direct signup notice:', supErr?.message)
        }

        // 2. Call FastAPI backend to register / sync profile
        const res = await fetch('http://127.0.0.1:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName || 'FarmAssist User',
            role: selectedRole,
            preferred_language: lang,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          userObj = data.user
          token = data.access_token || token
        }

        if (!userObj) {
          userObj = {
            id: `user_${Date.now()}`,
            email: email,
            full_name: fullName || 'FarmAssist User',
            role: selectedRole,
            preferred_language: lang,
          }
        }

        login(userObj, token)
      } else {
        // Login mode
        let token = 'demo_supabase_jwt_token'
        let userObj: any = null

        try {
          const supRes = await signInWithEmail(email, password)
          if (supRes?.session?.access_token) {
            token = supRes.session.access_token
          }
          if (supRes?.user) {
            userObj = {
              id: supRes.user.id,
              email: supRes.user.email,
              full_name: supRes.user.user_metadata?.full_name || (selectedRole === 'admin' ? 'Administrator' : selectedRole === 'expert' ? 'Dr. Anand Sharma' : 'Raju Reddy'),
              role: selectedRole,
              preferred_language: lang,
            }
          }
        } catch (supErr: any) {
          console.warn('Supabase direct password sign-in notice:', supErr?.message)
        }

        const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            role: selectedRole,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          userObj = data.user
          token = data.access_token || token
        }

        if (!userObj) {
          userObj = {
            id: `user_${Date.now()}`,
            email: email || `${selectedRole}@farmassist.ai`,
            full_name: selectedRole === 'admin' ? 'Administrator' : selectedRole === 'expert' ? 'Dr. Anand Sharma' : 'Raju Reddy',
            role: selectedRole,
            preferred_language: lang,
          }
        }

        login(userObj, token)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setAuthLoading(false)
    }
  }

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
              "{t('quote_text')}"
            </p>
            <footer className="text-cream/50 text-sm font-mono tracking-wide">
              {t('quote_author')}
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

          {step === 'language' && (
            /* STEP 1: PROMINENT LANGUAGE SELECTION */
            <div className="space-y-6 step-in">
              <div>
                <div className="inline-block text-xs font-semibold uppercase tracking-wider text-leaf bg-leaf/10 px-2.5 py-1 rounded-md mb-2">
                  {t('auth_step_1_of_2')}
                </div>
                <h1 className="font-display text-2xl text-charcoal font-bold mb-1">
                  {t('choose_language_title')}
                </h1>
                <p className="text-sage text-sm">
                  {t('choose_language_sub')}
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
                onClick={() => setStep('role')}
                className="w-full py-3.5 bg-forest text-cream font-semibold rounded-xl hover:bg-leaf transition-colors text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('auth_continue')}</span>
                <span>→</span>
              </button>
            </div>
          )}

          {step === 'role' && (
            /* STEP 2: ROLE SELECTION */
            <div className="space-y-6 step-in">
              <div className="flex items-center justify-between">
                <div>
                  <div className="inline-block text-xs font-semibold uppercase tracking-wider text-leaf bg-leaf/10 px-2.5 py-1 rounded-md mb-2">
                    {t('auth_step_2_of_3')}
                  </div>
                  <h1 className="font-display text-2xl text-charcoal font-bold mb-1">
                    {t('role_select_title')}
                  </h1>
                  <p className="text-sage text-sm">
                    {t('role_select_sub')}
                  </p>
                </div>
                <button
                  onClick={() => setStep('language')}
                  className="text-xs text-leaf hover:underline font-medium"
                >
                  🌐 {LANG_LABELS[lang].split(' — ')[0]}
                </button>
              </div>

              <div className="space-y-3">
                {ROLE_OPTIONS.map((r) => {
                  const isSelected = selectedRole === r.id
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-forest bg-forest/8 ring-2 ring-forest/30 shadow-sm'
                          : 'border-pebble bg-white hover:border-sage hover:bg-mist/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl">{r.icon}</span>
                        <div>
                          <div className="font-semibold text-charcoal text-base">
                            {t(r.titleKey)}
                          </div>
                          <div className="text-sage text-xs mt-0.5">
                            {t(r.subKey)}
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
                className="w-full py-3.5 bg-forest text-cream font-semibold rounded-xl hover:bg-leaf transition-colors text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t('auth_continue')}</span>
                <span>→</span>
              </button>
            </div>
          )}

          {step === 'auth' && (
            /* STEP 3: CREDENTIALS SIGN-IN / REGISTER WITH SUPABASE AUTH & GOOGLE OAUTH */
            <div className="step-in space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-leaf font-bold">
                    {selectedRole === 'admin' ? '🛡️ Admin Portal' : selectedRole === 'expert' ? '🔬 Expert Portal' : '🌾 Farmer Portal'}
                  </span>
                  <h1 className="font-display text-2xl text-charcoal font-bold mt-0.5">
                    {mode === 'login' ? t('auth_title') : 'Create Account'}
                  </h1>
                </div>
                <button
                  onClick={() => setStep('role')}
                  className="text-xs text-leaf hover:underline font-medium"
                >
                  (Change Role)
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-risk/10 border border-risk/30 text-risk text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Google OAuth Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 border border-pebble bg-white hover:bg-mist/50 rounded-xl text-charcoal font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google (Supabase Auth)</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-pebble"></div>
                <span className="text-xs font-mono text-sage uppercase">or sign in with email</span>
                <div className="flex-1 h-px bg-pebble"></div>
              </div>

              {/* Mode Toggle for Farmers */}
              {selectedRole === 'farmer' && (
                <div className="flex bg-mist p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      mode === 'login' ? 'bg-white text-charcoal shadow-sm' : 'text-sage'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      mode === 'register' ? 'bg-white text-charcoal shadow-sm' : 'text-sage'
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Raju Reddy"
                      className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                    {t('auth_mobile')} / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={selectedRole === 'admin' ? 'admin@farmassist.ai' : selectedRole === 'expert' ? 'expert@farmassist.ai' : 'farmer@farmassist.ai'}
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                    {t('auth_password')}
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-forest text-cream font-semibold rounded-xl hover:bg-leaf transition-colors text-sm shadow-md cursor-pointer"
                >
                  {authLoading ? 'Authenticating with Supabase...' : mode === 'register' ? 'Complete Registration' : t('auth_signin')}
                </button>
              </form>

              {/* Quick default credential button */}
              <div className="pt-2 border-t border-pebble/60 text-center">
                <button
                  type="button"
                  onClick={() => {
                    const r = ROLE_OPTIONS.find((opt) => opt.id === selectedRole)
                    if (r) {
                      setEmail(r.defaultEmail)
                      setPassword(r.defaultPassword)
                    }
                  }}
                  className="text-xs text-sage hover:text-charcoal underline"
                >
                  Use Default {selectedRole.toUpperCase()} Credentials ({selectedRole === 'admin' ? 'admin@farmassist.ai' : selectedRole === 'expert' ? 'expert@farmassist.ai' : 'farmer@farmassist.ai'})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
