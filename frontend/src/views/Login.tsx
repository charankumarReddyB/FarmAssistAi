import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { Logo } from '../components/Logo'
import { LANG_LABELS, type Lang } from '../translations'
import { signInWithGoogle, signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '../lib/supabase'
import { detectBrowserLocation, reverseGeocode } from '../lib/location'
import { apiRequest } from '../lib/api'

const SIDE_IMAGE = 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&h=1200&fit=crop&auto=format'

export type LoginStep = 'auth' | 'location-permission' | 'location-manual'

interface LoginProps {
  initialStep?: LoginStep
  initialMode?: 'login' | 'register'
}

export function Login({ initialStep = 'auth', initialMode = 'login' }: LoginProps) {
  const { t, setView, lang, setLang, login, user: currentUser } = useApp()
  const [step, setStep] = useState<LoginStep>(initialStep)
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Keep step and mode synchronized if props change
  useEffect(() => {
    setStep(initialStep)
  }, [initialStep])

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  // Manual location fields
  const [stateName, setStateName] = useState('')
  const [districtName, setDistrictName] = useState('')
  const [villageName, setVillageName] = useState('')

  // State management for location detection and auth
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [locStatusText, setLocStatusText] = useState('')
  const [pendingToken, setPendingToken] = useState<string | null>(() => localStorage.getItem('farmassist_token'))
  const [pendingUser, setPendingUser] = useState<any>(currentUser || null)

  const handleGoogleLogin = async () => {
    setErrorMsg(null)
    setAuthLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      console.error('[AUTH] Google Sign In error:', err)
      setErrorMsg(err.message || 'Google authentication failed. Please check your connection and try again.')
      setAuthLoading(false)
    }
  }

  // Finalize onboarding with given location data
  const completeUserOnboarding = async (
    userObj: any,
    token: string,
    locData?: {
      country?: string
      state?: string
      district?: string
      village_or_city?: string
      latitude?: number
      longitude?: number
    }
  ) => {
    const updatedUser = {
      ...userObj,
      ...(locData?.country ? { country: locData.country } : {}),
      ...(locData?.state ? { state: locData.state } : {}),
      ...(locData?.district ? { district: locData.district } : {}),
      ...(locData?.village_or_city ? { village_or_city: locData.village_or_city, village: locData.village_or_city } : {}),
      ...(locData?.latitude !== undefined ? { latitude: locData.latitude } : {}),
      ...(locData?.longitude !== undefined ? { longitude: locData.longitude } : {}),
      onboarding_completed: true,
    }

    // Update backend profile
    try {
      await apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...locData,
          onboarding_completed: true,
          preferred_language: lang,
        }),
      })
    } catch (e) {
      console.warn('[AUTH] Backend profile update note:', e)
    }

    // Call complete-onboarding endpoint
    try {
      await apiRequest('/user/complete-onboarding', {
        method: 'POST',
      })
    } catch (e) {}

    login(updatedUser, token)
  }

  // Automatic Location Detection via Browser Geolocation API & Reverse Geocoding
  const handleAllowLocation = async () => {
    setErrorMsg(null)
    setLocLoading(true)
    setLocStatusText('Requesting GPS permission from browser...')

    try {
      const coords = await detectBrowserLocation()
      setLocStatusText('Reverse geocoding your region & climate zone...')

      const geocoded = await reverseGeocode(coords.latitude, coords.longitude)

      const token = pendingToken || localStorage.getItem('farmassist_token') || 'auth_token'
      const baseUser = pendingUser || currentUser || {
        id: `user_${Date.now()}`,
        email: email || 'farmer@farmassist.ai',
        full_name: fullName || 'Farmer User',
        role: 'farmer',
        preferred_language: lang,
      }

      await completeUserOnboarding(baseUser, token, geocoded)
    } catch (err: any) {
      console.warn('[AUTH] Geolocation detection error:', err)
      setErrorMsg(err.message || 'Location permission was denied or unavailable. Please enter your location manually.')
      setLocLoading(false)
      setStep('location-manual')
    }
  }

  // Manual Location Form Submission
  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLocLoading(true)

    const token = pendingToken || localStorage.getItem('farmassist_token') || 'auth_token'
    const baseUser = pendingUser || currentUser || {
      id: `user_${Date.now()}`,
      email: email || 'farmer@farmassist.ai',
      full_name: fullName || 'Farmer User',
      role: 'farmer',
      preferred_language: lang,
    }

    const locData = {
      state: stateName.trim() || undefined,
      district: districtName.trim() || undefined,
      village_or_city: villageName.trim() || undefined,
    }

    await completeUserOnboarding(baseUser, token, locData)
    setLocLoading(false)
  }

  // Skip Location Option
  const handleSkipLocation = async () => {
    const token = pendingToken || localStorage.getItem('farmassist_token') || 'auth_token'
    const baseUser = pendingUser || currentUser || {
      id: `user_${Date.now()}`,
      email: email || 'farmer@farmassist.ai',
      full_name: fullName || 'Farmer User',
      role: 'farmer',
      preferred_language: lang,
    }

    await completeUserOnboarding(baseUser, token, undefined)
  }

  // Email / Password Form Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setAuthLoading(true)

    try {
      if (mode === 'register') {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.')
        }
        if (!email.trim()) {
          throw new Error('Please enter a valid email address.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }

        let token = ''
        let userObj: any = null

        // 1. Supabase Auth signup
        if (isSupabaseConfigured()) {
          try {
            const supRes = await signUpWithEmail(email, password, {
              full_name: fullName,
              preferred_language: lang,
            })

            if (supRes?.session?.access_token) {
              token = supRes.session.access_token
            }
            if (supRes?.user) {
              userObj = {
                id: supRes.user.id,
                email: supRes.user.email,
                full_name: fullName,
                role: 'farmer',
                preferred_language: lang,
                onboarding_completed: false,
              }
            }
          } catch (supErr: any) {
            console.warn('[AUTH] Supabase Auth direct signup notice:', supErr?.message)
            if (supErr.message && (supErr.message.includes('already registered') || supErr.message.includes('already exists'))) {
              throw supErr
            }
          }
        }

        // 2. Call FastAPI backend to register
        try {
          const backendData = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              email,
              password,
              full_name: fullName,
              preferred_language: lang,
            }),
          })
          if (backendData?.user) {
            userObj = backendData.user
            token = backendData.access_token || token
          }
        } catch (apiErr: any) {
          console.warn('[AUTH] Backend register call notice:', apiErr)
          if (!userObj) {
            throw apiErr
          }
        }

        if (!userObj) {
          userObj = {
            id: `user_${Date.now()}`,
            email: email,
            full_name: fullName,
            role: 'farmer',
            preferred_language: lang,
            onboarding_completed: false,
          }
        }

        // Save token and pending user, then proceed to automatic location permission screen
        localStorage.setItem('farmassist_token', token)
        setPendingToken(token)
        setPendingUser(userObj)
        setStep('location-permission')
      } else {
        // Sign In mode
        let token = ''
        let userObj: any = null
        let loginError: string | null = null

        const cleanEmail = email.trim().toLowerCase()
        const cleanPassword = password.trim()

        // 1. Primary Authentication: FastAPI Backend
        try {
          const backendData = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: cleanEmail,
              password: cleanPassword,
            }),
          })
          if (backendData?.user && backendData?.access_token) {
            userObj = backendData.user
            token = backendData.access_token
          }
        } catch (apiErr: any) {
          console.warn('[AUTH] Backend login call notice:', apiErr?.message)
          loginError = apiErr?.message || 'Invalid email or password. Please try again.'
        }

        // 2. Secondary/Optional Authentication: Supabase (if configured)
        if (!userObj && isSupabaseConfigured()) {
          try {
            const supRes = await signInWithEmail(cleanEmail, cleanPassword)
            if (supRes?.session?.access_token) {
              token = supRes.session.access_token
              const isAdmin = cleanEmail === 'charankumarreddybantrothula@gmail.com'
              userObj = {
                id: supRes.user?.id || `user_${Date.now()}`,
                email: supRes.user?.email || cleanEmail,
                full_name: supRes.user?.user_metadata?.full_name || (isAdmin ? 'Charan Kumar Reddy' : 'Farmer User'),
                role: isAdmin ? 'admin' : 'farmer',
                preferred_language: lang,
                onboarding_completed: true,
              }
            }
          } catch (supErr: any) {
            console.warn('[AUTH] Supabase direct sign-in notice:', supErr?.message)
            if (!supErr.message?.includes('API key')) {
              loginError = supErr.message
            }
          }
        }

        if (!userObj || !token) {
          throw new Error(loginError || 'Invalid email or password. Please try again.')
        }

        // Check onboarding status — Admins and Experts strictly bypass location detection
        if (userObj.role === 'admin' || userObj.role === 'expert') {
          login(userObj, token)
        } else if (userObj.onboarding_completed === false && !userObj.district && !userObj.latitude) {
          setPendingToken(token)
          setPendingUser(userObj)
          setStep('location-permission')
        } else {
          login(userObj, token)
        }
      }
    } catch (err: any) {
      console.error('[AUTH] Auth error:', err)
      setErrorMsg(err.message || 'Authentication failed. Please verify your connection and try again.')
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
            alt="Farmer in a lush green agricultural field"
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
            <button onClick={() => setView('landing')} className="cursor-pointer">
              <Logo size={28} />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-sage">
              <span>🌐</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="bg-transparent border border-pebble rounded-md px-2 py-1 text-xs text-charcoal font-medium focus:outline-none cursor-pointer"
              >
                {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP: CREDENTIALS SIGN-IN / REGISTER */}
          {step === 'auth' && (
            <div className="step-in space-y-5">
              <div>
                <h1 className="font-display text-2xl text-charcoal font-bold">
                  {mode === 'login' ? t('auth_title') : 'Create Farmer Account'}
                </h1>
                <p className="text-sage text-xs mt-1">
                  {mode === 'login'
                    ? 'Sign in to access your farm intelligence portal'
                    : 'Register with your name, email and password'}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-risk/10 border border-risk/30 text-risk text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Google OAuth Login Button */}
              <button
                type="button"
                id="google-signin-btn"
                disabled={authLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 border border-pebble bg-white hover:bg-mist/50 rounded-xl text-charcoal font-semibold text-sm flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{authLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-pebble"></div>
                <span className="text-xs font-mono text-sage uppercase">or continue with email</span>
                <div className="flex-1 h-px bg-pebble"></div>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-mist p-1 rounded-xl">
                <button
                  type="button"
                  id="tab-signin"
                  onClick={() => { setMode('login'); setErrorMsg(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    mode === 'login' ? 'bg-white text-charcoal shadow-sm font-semibold' : 'text-sage'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="tab-register"
                  onClick={() => { setMode('register'); setErrorMsg(null); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    mode === 'register' ? 'bg-white text-charcoal shadow-sm font-semibold' : 'text-sage'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} autoComplete="off" className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      id="input-fullname"
                      name="farm_user_fullname"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    id="input-email"
                    name="farm_user_email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@farmassist.ai"
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
                    id="input-password"
                    name="farm_user_password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/50 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <button
                  type="submit"
                  id="submit-auth-btn"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-forest text-cream font-semibold rounded-xl hover:bg-leaf transition-colors text-sm shadow-md cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? 'Authenticating...' : mode === 'register' ? 'Create Account & Continue' : t('auth_signin')}
                </button>
              </form>
            </div>
          )}

          {/* STEP: AUTOMATIC LOCATION PERMISSION REQUEST */}
          {step === 'location-permission' && (
            <div className="step-in space-y-6 text-center">
              <div className="w-16 h-16 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
                📍
              </div>

              <div>
                <h1 className="font-display text-2xl text-charcoal font-bold mb-2">
                  Enable Farm Location
                </h1>
                <p className="text-sage text-sm leading-relaxed max-w-xs mx-auto">
                  FarmAssist AI uses your location to provide local weather intelligence, agro-climatic advisories, and crop disease risk assessments.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-risk/10 border border-risk/30 text-risk text-xs rounded-xl text-left">
                  {errorMsg}
                </div>
              )}

              {locLoading && (
                <div className="p-4 bg-mist/80 border border-pebble/60 rounded-xl flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-charcoal font-medium">{locStatusText || 'Detecting GPS location...'}</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  id="allow-location-btn"
                  disabled={locLoading}
                  onClick={handleAllowLocation}
                  className="w-full py-3.5 bg-forest text-cream font-semibold rounded-xl hover:bg-leaf transition-colors text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Allow Location Access (GPS)</span>
                  <span>🛰</span>
                </button>

                <button
                  type="button"
                  id="manual-location-btn"
                  disabled={locLoading}
                  onClick={() => setStep('location-manual')}
                  className="w-full py-3 px-4 border border-pebble bg-white hover:bg-mist/50 rounded-xl text-charcoal font-medium text-sm transition-colors cursor-pointer"
                >
                  Enter Location Manually
                </button>

                <button
                  type="button"
                  id="skip-location-btn"
                  disabled={locLoading}
                  onClick={handleSkipLocation}
                  className="text-xs text-sage hover:text-charcoal transition-colors pt-2 block mx-auto underline cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* STEP: MANUAL LOCATION FORM (FALLBACK) */}
          {step === 'location-manual' && (
            <div className="step-in space-y-6">
              <div>
                <button
                  type="button"
                  onClick={() => setStep('location-permission')}
                  className="text-xs text-leaf hover:underline font-medium mb-3 flex items-center gap-1 cursor-pointer"
                >
                  <span>←</span>
                  <span>Back to Automatic Detection</span>
                </button>
                <h1 className="font-display text-2xl text-charcoal font-bold mb-1">
                  Enter Your Farm Location
                </h1>
                <p className="text-sage text-sm">
                  Specify your state and district to configure local weather and soil matrices.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-risk/10 border border-risk/30 text-risk text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleManualLocationSubmit} autoComplete="off" className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    id="manual-state"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="e.g. Andhra Pradesh, Tamil Nadu, Punjab"
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/40 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                    District
                  </label>
                  <input
                    type="text"
                    required
                    id="manual-district"
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    placeholder="e.g. Kakinada, Chennai, Ludhiana"
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/40 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-sage mb-1 uppercase tracking-wide">
                    Village / City (Optional)
                  </label>
                  <input
                    type="text"
                    id="manual-village"
                    value={villageName}
                    onChange={(e) => setVillageName(e.target.value)}
                    placeholder="e.g. Samalkota, Guindy, Khanna"
                    className="w-full px-4 py-3 rounded-lg border border-pebble bg-white text-charcoal placeholder:text-sage/40 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/40"
                  />
                </div>

                <button
                  type="submit"
                  id="save-manual-location-btn"
                  disabled={locLoading}
                  className="w-full py-3.5 bg-forest text-cream font-semibold rounded-xl hover:bg-leaf transition-colors text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {locLoading ? 'Saving Location...' : 'Save Location & Continue'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
