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

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'farmer' | 'expert' | 'admin'
  preferred_language: Lang
  state?: string
  district?: string
  village?: string
}

interface AppCtx {
  view: View
  setView: (v: View) => void
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

import { supabase, isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const [view, setViewState] = useState<View>('landing')

  // Read authenticated user state from localStorage
  const [user, setUser] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem('farmassist_user')
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch (e) {}
    }
    return null
  })

  const role = user?.role || (localStorage.getItem('farmassist_role') as any) || 'farmer'

  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('farmassist_language') as Lang
    if (saved && ['en', 'te', 'ta', 'hi'].includes(saved)) {
      return saved
    }
    if (user && user.preferred_language && ['en', 'te', 'ta', 'hi'].includes(user.preferred_language)) {
      return user.preferred_language as Lang
    }
    return 'en'
  })

  // Role-Based Authorization Guard for Views
  const setView = (requestedView: View) => {
    if (requestedView === 'landing' || requestedView === 'login' || requestedView === 'expert-login') {
      setViewState(requestedView)
      return
    }

    const currentRole = user?.role || (localStorage.getItem('farmassist_role') as any) || 'farmer'

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

  // Supabase Auth State Change Listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const token = session.access_token
        localStorage.setItem('farmassist_token', token)

        // Fetch or create profile record in Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const userObj: UserProfile = {
          id: session.user.id,
          email: session.user.email || 'farmer@farmassist.ai',
          full_name: profile?.full_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Farmer User',
          role: profile?.role || session.user.user_metadata?.role || 'farmer',
          preferred_language: profile?.preferred_language || session.user.user_metadata?.preferred_language || 'en',
          state: profile?.state || 'Andhra Pradesh',
          district: profile?.district || 'Kakinada',
          village: profile?.village || 'Samalkota',
        }

        setUser(userObj)
        localStorage.setItem('farmassist_user', JSON.stringify(userObj))
        localStorage.setItem('farmassist_role', userObj.role)

        if (userObj.preferred_language && ['en', 'te', 'ta', 'hi'].includes(userObj.preferred_language)) {
          setLangState(userObj.preferred_language)
          updateGlobalFontAndLang(userObj.preferred_language)
        }

        // Automatically redirect signed-in user from landing/login to role dashboard
        setViewState((currentView) => {
          if (currentView === 'landing' || currentView === 'login' || currentView === 'expert-login') {
            return userObj.role === 'admin' ? 'admin' : userObj.role === 'expert' ? 'expert' : 'dashboard'
          }
          return currentView
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    updateGlobalFontAndLang(lang)

    // Sync profile from backend if token present
    const token = localStorage.getItem('farmassist_token')
    if (token) {
      fetch('http://127.0.0.1:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.ok ? res.json() : null)
        .then((userData) => {
          if (userData) {
            setUser(userData)
            localStorage.setItem('farmassist_user', JSON.stringify(userData))
            localStorage.setItem('farmassist_role', userData.role)
            if (userData.preferred_language && ['en', 'te', 'ta', 'hi'].includes(userData.preferred_language)) {
              setLangState(userData.preferred_language)
              updateGlobalFontAndLang(userData.preferred_language)
            }
          }
        })
        .catch(() => {})
    }
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
    fetch('http://127.0.0.1:8000/api/user/profile', {
      method: 'POST',
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

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updatedFields } as UserProfile
      localStorage.setItem('farmassist_user', JSON.stringify(next))

      if (isSupabaseConfigured() && next.id) {
        supabase
          .from('profiles')
          .update(updatedFields)
          .eq('id', next.id)
          .then()
      }
      return next
    })
  }

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {})
    }
    setUser(null)
    localStorage.removeItem('farmassist_user')
    localStorage.removeItem('farmassist_token')
    localStorage.removeItem('farmassist_role')
    setViewState('landing')
  }

  const t = (key: string) => translate(lang, key)

  const ctx: AppCtx = { view, setView, lang, setLang, t, user, updateUser, role, login, logout }

  if (view === 'landing') {
    return (
      <AppContext.Provider value={ctx}>
        <Landing />
      </AppContext.Provider>
    )
  }

  if (view === 'login' || view === 'expert-login') {
    return (
      <AppContext.Provider value={ctx}>
        <Login isExpert={view === 'expert-login'} initialRole={view === 'expert-login' ? 'expert' : undefined} />
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
