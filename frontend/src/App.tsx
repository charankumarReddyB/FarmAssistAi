import { useState, createContext, useContext } from 'react'
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

interface AppCtx {
  view: View
  setView: (v: View) => void
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

export const AppContext = createContext<AppCtx>({
  view: 'landing',
  setView: () => {},
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
})

export const useApp = () => useContext(AppContext)

const FARMER_VIEWS: View[] = ['dashboard', 'soil', 'crop', 'advisory', 'voice', 'farm', 'reports', 'alerts']

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
  const [view, setView] = useState<View>('landing')
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('farmassist_language') as Lang
    if (saved && ['en', 'te', 'ta', 'hi'].includes(saved)) {
      return saved
    }
    return 'en'
  })

  // Synchronize document language and font attributes on change
  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('farmassist_language', newLang)
    document.documentElement.lang = newLang
    
    // Save to user profile in localStorage for backend sync
    const userJson = localStorage.getItem('farmassist_user')
    const userObj = userJson ? JSON.parse(userJson) : { name: 'Raju Reddy', location: 'Kakinada, Andhra Pradesh' }
    userObj.preferred_language = newLang
    localStorage.setItem('farmassist_user', JSON.stringify(userObj))
  }

  const t = (key: string) => translate(lang, key)

  const ctx: AppCtx = { view, setView, lang, setLang, t }

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
        <Login isExpert={view === 'expert-login'} />
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

  return (
    <AppContext.Provider value={ctx}>
      <AppShell view={view} />
    </AppContext.Provider>
  )
}
