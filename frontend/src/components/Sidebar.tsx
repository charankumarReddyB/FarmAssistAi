import { useApp, type View } from '../App'
import { Logo } from './Logo'

interface NavItem {
  id: View
  icon: string
  labelKey: string
}

const FARMER_NAV: NavItem[] = [
  { id: 'dashboard', icon: '⬡', labelKey: 'nav_dashboard' },
  { id: 'soil', icon: '◎', labelKey: 'nav_soil' },
  { id: 'crop', icon: '⬢', labelKey: 'nav_crop' },
  { id: 'farm', icon: '◈', labelKey: 'nav_farm' },
  { id: 'advisory', icon: '◐', labelKey: 'nav_advisory' },
  { id: 'reports', icon: '≡', labelKey: 'nav_reports' },
  { id: 'alerts', icon: '◉', labelKey: 'nav_alerts' },
  { id: 'voice', icon: '◯', labelKey: 'nav_voice' },
]

const ADMIN_NAV: NavItem[] = [
  { id: 'admin', icon: '👑', labelKey: 'Administrator Console' },
  { id: 'settings', icon: '⚙️', labelKey: 'System Settings' },
]

const EXPERT_NAV: NavItem[] = [
  { id: 'expert', icon: '🔬', labelKey: 'Expert Review Portal' },
  { id: 'settings', icon: '⚙️', labelKey: 'Expert Settings' },
]

export function Sidebar() {
  const { view, setView, t, user, logout } = useApp()

  const displayName = user?.full_name || user?.display_name || (user?.email ? user.email.split('@')[0] : 'User')
  const userInitial = displayName.charAt(0).toUpperCase()
  const displayLocation = user?.district && user?.state
    ? `${user.district}, ${user.state}`
    : user?.district || user?.state || (user?.role === 'admin' ? 'Administrator' : user?.role === 'expert' ? 'Agricultural Expert' : 'Location Not Set')

  const navItems = user?.role === 'admin' ? ADMIN_NAV : user?.role === 'expert' ? EXPERT_NAV : FARMER_NAV

  return (
    <aside className="w-56 flex-shrink-0 bg-forest flex flex-col h-full">
      {/* Logo area */}
      <div className="px-5 py-5 border-b border-white/10">
        <Logo variant="light" size={32} />
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive = view === item.id
          const label = item.labelKey.startsWith('nav_') ? t(item.labelKey) : item.labelKey
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-leaf text-cream font-medium'
                  : 'text-cream/70 hover:bg-white/8 hover:text-cream'
              }`}
            >
              <span className="text-base w-5 flex-shrink-0 text-center leading-none opacity-80">
                {item.icon}
              </span>
              <span className="truncate">{label}</span>
              {item.id === 'alerts' && (
                <span className="ml-auto bg-harvest text-cream text-xs font-mono rounded px-1.5 py-0.5 leading-none">
                  3
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-white/10 pt-3">
        {/* Profile / Settings link */}
        <button
          onClick={() => setView('settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-cream/70 hover:bg-white/8 hover:text-cream transition-all cursor-pointer"
        >
          <span className="w-6 h-6 rounded-full bg-harvest/80 flex items-center justify-center text-xs text-cream font-semibold flex-shrink-0 uppercase overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </span>
          <div className="flex-1 text-left min-w-0">
            <div className="text-cream/90 text-sm font-medium truncate">{displayName}</div>
            <div className="text-cream/50 text-xs truncate">{displayLocation}</div>
          </div>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-cream/40 hover:text-cream/70 hover:bg-white/5 transition-all cursor-pointer"
        >
          <span className="text-base w-5 text-center opacity-70">⎋</span>
          <span>{t('nav_logout')}</span>
        </button>
      </div>
    </aside>
  )
}
