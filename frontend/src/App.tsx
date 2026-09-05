import { useState, useEffect, createContext, useContext } from 'react'
import { translate, type Lang } from './translations'
import { Landing } from './views/Landing'
import { Login } from './views/Login'
import { Dashboard } from './views/Dashboard'
import { SoilAnalysis } from './views/SoilAnalysis'
import { CropAnalysis } from './views/CropAnalysis'
import { Advisory } from './views/Advisory'
import { VoiceAssistant } from './views/VoiceAssistant'
import { MyFarm } from './views/MyFarm'
import { Reports } from './views/Reports'
import { Alerts } from './views/Alerts'
import { ExpertPortal } from './views/ExpertPortal'
import { AdminDashboard } from './views/AdminDashboard'
import { Settings } from './views/Settings'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Logo } from './components/Logo'
import { supabase, isSupabaseConfigured, syncSupabaseProfile, signOutSupabase } from './lib/supabase'
import { apiRequest, getApiBaseUrl } from './lib/api'

export type View =
  | 'landing'
  | 'login'
  | 'expert-login'
  | 'dashboard'
  | 'soil'
  | 'crop'
  | 'advisory'
  | 'voice'
  | 'farm'
  | 'reports'
  | 'alerts'
  | 'settings'
  | 'expert'
  | 'admin'
  | 'unauthorized'

export type AuthState = 'loading' | 'unauthenticated' | 'authenticated'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  display_name?: string
  avatar_url?: string
  phone?: string
  role: 'farmer' | 'expert' | 'admin'
  preferred_language: Lang
  country?: string
  state?: string
  district?: string
  city_town?: string
  village_or_city?: string
  village?: string
  latitude?: number
  longitude?: number
  onboarding_completed?: boolean
  auth_provider?: string

  // Farm Details
  farm_name?: string
  farm_size?: string
  current_crop?: string
  soil_type?: string
  irrigation_method?: string
  sowing_date?: string
  crop_stage?: string
  experience_years?: string
  water_source?: string
  survey_number?: string
}

interface AppCtx {
  view: View
  setView: (v: View) => void
  authMode: 'login' | 'register'
  setAuthMode: (m: 'login' | 'register') => void
  openAuth: (m: 'login' | 'register') => void
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  user: UserProfile | null
  updateUser: (userObj: Partial<UserProfile>) => void
  role: 'farmer' | 'expert' | 'admin'
  login: (userObj: any, token: string) => void
  logout: () => void
}

export const AppContext = createContext<AppCtx>({
  view: 'landing',
  setView: () => {},
  authMode: 'login',
  setAuthMode: () => {},
  openAuth: () => {},
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  user: null,
  updateUser: () => {},
  role: 'farmer',
  login: () => {},
  logout: () => {},
})

export const useApp = () => useContext(AppContext)

function updateGlobalFontAndLang(newLang: Lang) {
  document.documentElement.lang = newLang
  document.documentElement.setAttribute('data-lang', newLang)
  if (document.body) {
    document.body.setAttribute('data-lang', newLang)
  }
}

function AppShell({ view }: { view: View }) {
  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />
      case 'soil': return <SoilAnalysis />
      case 'crop': return <CropAnalysis />
      case 'advisory': return <Advisory />
      case 'voice': return <VoiceAssistant />
      case 'farm': return <MyFarm />
      case 'reports': return <Reports />
      case 'alerts': return <Alerts />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [view, setViewState] = useState<View>('landing')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState<UserProfile | null>(null)

  const role = user?.role || 'farmer'

  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('farmassist_language') as Lang
    if (saved && ['en', 'te', 'ta', 'hi'].includes(saved)) {
      return saved
    }
    return 'en'
  })

  // Role-Based Authorization Guard for Views
  const setView = (requestedView: View) => {
    if (requestedView === 'landing' || requestedView === 'login' || requestedView === 'expert-login') {
      setViewState(requestedView)
      return
    }

    // Unauthenticated users cannot navigate to internal views
    if (!user && authState !== 'authenticated') {
      setViewState('landing')
      return
    }

    const currentRole = user?.role || 'farmer'

    if (currentRole === 'farmer') {
      if (requestedView === 'expert' || requestedView === 'admin') {
        setViewState('dashboard')
        return
      }
      setViewState(requestedView)
    } else if (currentRole === 'expert') {
      if (requestedView === 'admin' || ['dashboard', 'soil', 'crop', 'farm', 'advisory', 'reports', 'alerts', 'voice'].includes(requestedView)) {
        setViewState('expert')
        return
      }
      setViewState(requestedView)
    } else if (currentRole === 'admin') {
      if (['dashboard', 'soil', 'crop', 'farm', 'advisory', 'reports', 'alerts', 'voice', 'expert'].includes(requestedView)) {
        setViewState('admin')
        return
      }
      setViewState(requestedView)
    } else {
      setViewState(requestedView)
    }
  }

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setViewState('login')
  }

  // Centralized Session Processing — Supabase is Source of Truth
  const processSession = async (session: any) => {
    try {
      console.log('[AUTH] Processing session. User present:', Boolean(session?.user))

      if (!session?.user) {
        // If an OAuth hash is present in URL, do not treat as unauthenticated yet
        const isOAuthHash = window.location.hash.includes('access_token=') || window.location.search.includes('code=')
        if (isOAuthHash) {
          console.log('[AUTH] OAuth hash detected. Awaiting onAuthStateChange to deliver session...')
          return
        }

        console.log('[AUTH] No active session found.')
        localStorage.removeItem('farmassist_user')
        localStorage.removeItem('farmassist_token')
        localStorage.removeItem('farmassist_role')
        setUser(null)
        setAuthState('unauthenticated')
        setViewState((cur) => (cur === 'login' || cur === 'expert-login' ? cur : 'landing'))
        return
      }

      const token = session.access_token || localStorage.getItem('farmassist_token') || ''
      localStorage.setItem('farmassist_token', token)
      console.log('[AUTH] Active session found for user ID:', session.user.id, session.user.email)

      // 1. Sync Supabase database profiles table
      let supabaseProfile: any = null
      try {
        supabaseProfile = await syncSupabaseProfile(session.user)
      } catch (e) {
        console.warn('[AUTH] Supabase profile sync error:', e)
      }

      // 2. Sync with FastAPI backend /api/auth/me
      let backendUser: any = null
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          backendUser = await res.json()
          console.log('[AUTH] Backend /api/auth/me sync succeeded. Role:', backendUser.role)
        }
      } catch (e) {
        console.warn('[AUTH] Backend sync note:', e)
      }

      const effectiveRole = (
        session.user.email?.toLowerCase() === 'charankumarreddybantrothula@gmail.com'
      ) ? 'admin' : (backendUser?.role === 'admin' ? 'farmer' : (backendUser?.role || supabaseProfile?.role || 'farmer'))

      const isOnboarded = backendUser?.onboarding_completed ?? supabaseProfile?.onboarding_completed ?? false
      const hasLocation = Boolean(
        backendUser?.district || backendUser?.latitude || supabaseProfile?.district || supabaseProfile?.latitude
      )

      const finalUser: UserProfile = {
        id: session.user.id,
        email: session.user.email || 'farmer@farmassist.ai',
        full_name: backendUser?.full_name || supabaseProfile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Farmer User',
        display_name: backendUser?.display_name || supabaseProfile?.display_name || session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'Farmer User',
        avatar_url: backendUser?.avatar_url || supabaseProfile?.avatar_url || session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
        phone: backendUser?.phone || supabaseProfile?.phone,
        role: effectiveRole,
        preferred_language: (backendUser?.preferred_language || supabaseProfile?.preferred_language || 'en') as Lang,
        country: backendUser?.country || supabaseProfile?.country,
        state: backendUser?.state || supabaseProfile?.state,
        district: backendUser?.district || supabaseProfile?.district,
        city_town: backendUser?.city_town || supabaseProfile?.city_town,
        village_or_city: backendUser?.village_or_city || supabaseProfile?.village_or_city,
        village: backendUser?.village || supabaseProfile?.village,
        latitude: backendUser?.latitude ?? supabaseProfile?.latitude,
        longitude: backendUser?.longitude ?? supabaseProfile?.longitude,
        onboarding_completed: isOnboarded,
        auth_provider: backendUser?.auth_provider || supabaseProfile?.auth_provider || (session.user.app_metadata?.provider || 'google'),

        // Farm fields
        farm_name: backendUser?.farm_name,
        farm_size: backendUser?.farm_size,
        current_crop: backendUser?.current_crop,
        soil_type: backendUser?.soil_type,
        irrigation_method: backendUser?.irrigation_method,
        sowing_date: backendUser?.sowing_date,
        crop_stage: backendUser?.crop_stage,
        experience_years: backendUser?.experience_years,
        water_source: backendUser?.water_source,
        survey_number: backendUser?.survey_number,
      }

      setUser(finalUser)
      localStorage.setItem('farmassist_user', JSON.stringify(finalUser))
      localStorage.setItem('farmassist_role', finalUser.role)

      if (finalUser.preferred_language && ['en', 'te', 'ta', 'hi'].includes(finalUser.preferred_language)) {
        setLangState(finalUser.preferred_language)
        updateGlobalFontAndLang(finalUser.preferred_language)
      }

      setAuthState('authenticated')

      // Clean OAuth hash from URL without reload
      if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error') || window.location.hash === '#')) {
        window.history.replaceState(null, '', window.location.pathname)
      }

      // Direct routing decision — Admins and Experts bypass location detection completely
      if (finalUser.role === 'admin') {
        console.log('[AUTH] Admin session active. Routing directly to Admin Dashboard.')
        setViewState('admin')
      } else if (finalUser.role === 'expert') {
        console.log('[AUTH] Expert session active. Routing directly to Expert Portal.')
        setViewState('expert')
      } else if (isOnboarded === false && !hasLocation) {
        console.log('[AUTH] Incomplete location onboarding for farmer. Directing to location onboarding.')
        setViewState('login')
      } else {
        console.log('[AUTH] Routing authenticated farmer to dashboard.')
        setViewState('dashboard')
      }
    } catch (err) {
      console.error('[AUTH] Critical error processing session:', err)
      setAuthState('unauthenticated')
      setViewState('landing')
    }
  }

  // Supabase Auth Listener & Session Initialization
  useEffect(() => {
    let isMounted = true
    const isOAuthHash = window.location.hash.includes('access_token=') || window.location.search.includes('code=')

    // Safety timeout: if session resolution hangs after 4 seconds, default safely to unauthenticated
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setAuthState((curr) => {
          if (curr === 'loading') {
            console.warn('[AUTH] Session check timed out. Defaulting to unauthenticated.')
            setViewState('landing')
            return 'unauthenticated'
          }
          return curr
        })
      }
    }, 4000)

    // Check for error parameters in URL (from OAuth redirects or failed signups)
    const urlParams = new URLSearchParams(window.location.search)
    const urlHash = window.location.hash
    const hasError = urlParams.has('error') || urlParams.has('error_description') || urlHash.includes('error=')
    
    if (hasError) {
      console.warn('[AUTH] URL contained error parameters:', window.location.search, urlHash)
      window.history.replaceState(null, '', window.location.pathname)
    }

    if (!isSupabaseConfigured()) {
      clearTimeout(fallbackTimer)
      localStorage.removeItem('farmassist_user')
      localStorage.removeItem('farmassist_token')
      localStorage.removeItem('farmassist_role')
      setUser(null)
      setAuthState('unauthenticated')
      setViewState('landing')
      return
    }

    // 1. Initial Session Check on App Startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      if (session?.user) {
        processSession(session)
      } else if (!isOAuthHash) {
        processSession(null)
      } else {
        console.log('[AUTH] OAuth hash in progress. Waiting for Supabase onAuthStateChange...')
      }
    }).catch((err) => {
      if (!isMounted) return
      console.error('[AUTH] getSession startup error:', err)
      if (!isOAuthHash) {
        setAuthState('unauthenticated')
        setViewState('landing')
      }
    })

    // 2. Real-time Auth State Subscription (handles OAuth callback redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      console.log('[AUTH] onAuthStateChange event:', event, 'session user:', session?.user?.email)
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          processSession(session)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        localStorage.removeItem('farmassist_user')
        localStorage.removeItem('farmassist_token')
        localStorage.removeItem('farmassist_role')
        setAuthState('unauthenticated')
        setViewState('landing')
      }
    })

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [])


  useEffect(() => {
    updateGlobalFontAndLang(lang)
  }, [lang])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('farmassist_language', newLang)
    updateGlobalFontAndLang(newLang)

    if (user) {
      const updated = { ...user, preferred_language: newLang }
      setUser(updated)
      localStorage.setItem('farmassist_user', JSON.stringify(updated))

      if (isSupabaseConfigured() && user.id) {
        supabase
          .from('profiles')
          .update({ preferred_language: newLang })
          .eq('id', user.id)
          .then()
      }
    }

    const token = localStorage.getItem('farmassist_token')
    fetch(`${getApiBaseUrl()}/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ preferred_language: newLang })
    }).catch(() => {})
  }

  const login = (userObj: any, token: string) => {
    setUser(userObj)
    localStorage.setItem('farmassist_user', JSON.stringify(userObj))
    localStorage.setItem('farmassist_token', token)
    localStorage.setItem('farmassist_role', userObj.role)
    setAuthState('authenticated')

    if (userObj.preferred_language && ['en', 'te', 'ta', 'hi'].includes(userObj.preferred_language)) {
      setLangState(userObj.preferred_language)
      updateGlobalFontAndLang(userObj.preferred_language)
    }

    if (userObj.role === 'admin') {
      setViewState('admin')
    } else if (userObj.role === 'expert') {
      setViewState('expert')
    } else {
      setViewState('dashboard')
    }
  }

  const updateUser = async (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updatedFields } as UserProfile
      localStorage.setItem('farmassist_user', JSON.stringify(next))
      return next
    })

    // 1. Sync Supabase profiles and farm_profiles tables if configured
    if (isSupabaseConfigured() && user?.id) {
      // Profile attributes
      const profileUpdates: any = {}
      if (updatedFields.full_name !== undefined) profileUpdates.full_name = updatedFields.full_name
      if (updatedFields.preferred_language !== undefined) profileUpdates.preferred_language = updatedFields.preferred_language
      if (updatedFields.state !== undefined) profileUpdates.state = updatedFields.state
      if (updatedFields.district !== undefined) profileUpdates.district = updatedFields.district
      if (updatedFields.village_or_city !== undefined) profileUpdates.village_or_city = updatedFields.village_or_city
      if (updatedFields.village !== undefined) profileUpdates.village = updatedFields.village
      if (updatedFields.latitude !== undefined) profileUpdates.latitude = updatedFields.latitude
      if (updatedFields.longitude !== undefined) profileUpdates.longitude = updatedFields.longitude
      if (updatedFields.phone !== undefined) profileUpdates.phone = updatedFields.phone
      if (updatedFields.onboarding_completed !== undefined) profileUpdates.onboarding_completed = updatedFields.onboarding_completed

      if (Object.keys(profileUpdates).length > 0) {
        supabase.from('profiles').update(profileUpdates).eq('id', user.id).then().catch(() => {})
      }

      // Farm attributes
      const farmUpdates: any = { user_id: user.id }
      if (updatedFields.farm_name !== undefined) farmUpdates.farm_name = updatedFields.farm_name
      if (updatedFields.farm_size !== undefined) farmUpdates.farm_size = updatedFields.farm_size
      if (updatedFields.current_crop !== undefined) farmUpdates.current_crop = updatedFields.current_crop
      if (updatedFields.soil_type !== undefined) farmUpdates.soil_type = updatedFields.soil_type
      if (updatedFields.irrigation_method !== undefined) farmUpdates.irrigation_method = updatedFields.irrigation_method
      if (updatedFields.sowing_date !== undefined) farmUpdates.sowing_date = updatedFields.sowing_date
      if (updatedFields.crop_stage !== undefined) farmUpdates.crop_stage = updatedFields.crop_stage
      if (updatedFields.experience_years !== undefined) farmUpdates.experience_years = updatedFields.experience_years
      if (updatedFields.water_source !== undefined) farmUpdates.water_source = updatedFields.water_source
      if (updatedFields.survey_number !== undefined) farmUpdates.survey_number = updatedFields.survey_number

      if (Object.keys(farmUpdates).length > 1) {
        supabase.from('farm_profiles').upsert(farmUpdates, { onConflict: 'user_id' }).then().catch(() => {})
      }
    }

    // 2. Sync FastAPI backend /api/user/profile
    try {
      await apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedFields),
      })
    } catch (err) {
      console.warn('[AUTH] Background updateUser sync notice:', err)
    }

  }

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await signOutSupabase().catch(() => {})
    }
    setUser(null)
    localStorage.removeItem('farmassist_user')
    localStorage.removeItem('farmassist_token')
    localStorage.removeItem('farmassist_role')
    setAuthState('unauthenticated')
    setViewState('landing')
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  const t = (key: string) => translate(lang, key)

  const ctx: AppCtx = {
    view,
    setView,
    authMode,
    setAuthMode,
    openAuth,
    lang,
    setLang,
    t,
    user,
    updateUser,
    role,
    login,
    logout
  }

  // 1. Loading state while checking Supabase session on startup / OAuth callback
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <Logo size={40} />
          <div className="w-7 h-7 border-3 border-forest border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-sage font-mono uppercase tracking-wider">
            Verifying secure session...
          </p>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated State
  if (authState === 'unauthenticated') {
    if (view === 'login' || view === 'expert-login') {
      return (
        <AppContext.Provider value={ctx}>
          <Login initialStep="auth" initialMode={authMode} />
        </AppContext.Provider>
      )
    }
    return (
      <AppContext.Provider value={ctx}>
        <Landing />
      </AppContext.Provider>
    )
  }

  // 3. Authenticated State
  if (view === 'login' || view === 'expert-login') {
    return (
      <AppContext.Provider value={ctx}>
        <Login key={user?.id || 'authenticated_onboarding'} initialStep="location-permission" initialMode={authMode} />
      </AppContext.Provider>
    )
  }

  if (view === 'expert') {
    return (
      <AppContext.Provider value={ctx}>
        <ExpertPortal />
      </AppContext.Provider>
    )
  }

  if (view === 'admin') {
    return (
      <AppContext.Provider value={ctx}>
        <AdminDashboard />
      </AppContext.Provider>
    )
  }

  return (
    <AppContext.Provider value={ctx}>
      <AppShell view={view} />
    </AppContext.Provider>
  )
}
