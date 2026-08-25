import { useState, useEffect } from 'react'
import { useApp } from '../App'

export function TopBar() {
  const { t, setView, user } = useApp()
  const [temp, setTemp] = useState<number | string>('32°C')

  const hasLocation = Boolean(user?.district || user?.state || (user?.latitude !== undefined && user?.latitude !== null))
  const userLocation = user?.district && user?.state
    ? `${user.district}, ${user.state}`
    : user?.district || user?.state || 'Location Not Set'

  const userInitial = (user?.display_name || user?.full_name || user?.email || 'F')[0].toUpperCase()

  useEffect(() => {
    if (!hasLocation && user?.latitude === undefined && user?.latitude === null) {
      setTemp('--°C')
      return
    }

    const query = user?.latitude !== undefined && user?.latitude !== null && user?.longitude !== undefined && user?.longitude !== null
      ? `latitude=${user.latitude}&longitude=${user.longitude}`
      : user?.district
      ? `location=${encodeURIComponent(user.district)}`
      : ''

    if (!query) {
      setTemp('--°C')
      return
    }

    fetch(`http://127.0.0.1:8000/api/weather?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.temperature !== undefined && data.temperature !== null) {
          setTemp(`${data.temperature}°C`)
        } else {
          setTemp('--°C')
        }
      })
      .catch(() => setTemp('--°C'))
  }, [user?.latitude, user?.longitude, user?.district, user?.state, hasLocation])

  return (
    <header className="flex-shrink-0 h-14 bg-cream border-b border-pebble flex items-center px-6 gap-4">
      {/* Location / Role Info */}
      <div className="flex items-center gap-2 min-w-0">
        {user?.role === 'admin' ? (
          <button
            onClick={() => setView('admin')}
            className="flex items-center gap-2 px-2.5 py-1 bg-forest/10 hover:bg-forest/20 text-forest rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <span>👑</span>
            <span>Administrator Console</span>
          </button>
        ) : user?.role === 'expert' ? (
          <button
            onClick={() => setView('expert')}
            className="flex items-center gap-2 px-2.5 py-1 bg-rain/10 hover:bg-rain/20 text-rain rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <span>🔬</span>
            <span>Expert Portal</span>
          </button>
        ) : (
          <>
            <span className="text-sage text-sm">📍</span>
            <span className="text-charcoal text-sm font-semibold truncate">{userLocation}</span>
            <span className="text-pebble text-xs mx-1">·</span>
            <span className="text-sage text-xs truncate">{t('dash_current_crop')}</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Weather shortcut (for farmers) or Console return (for admin/expert) */}
      {user?.role === 'admin' ? (
        <button
          onClick={() => setView('admin')}
          className="text-xs bg-forest text-cream font-bold px-3 py-1.5 rounded-lg hover:bg-leaf transition-colors cursor-pointer shadow-sm"
        >
          ← Back to Admin Console
        </button>
      ) : user?.role === 'expert' ? (
        <button
          onClick={() => setView('expert')}
          className="text-xs bg-forest text-cream font-bold px-3 py-1.5 rounded-lg hover:bg-leaf transition-colors cursor-pointer shadow-sm"
        >
          ← Back to Expert Portal
        </button>
      ) : (
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-1.5 text-sm text-charcoal/80 hover:text-charcoal transition-colors px-2.5 py-1 rounded-md bg-mist/60 border border-pebble/40 cursor-pointer"
        >
          <span>⛅</span>
          <span className="font-mono font-semibold text-xs">{temp}</span>
        </button>
      )}

      {/* Voice button */}
      <button
        onClick={() => setView('voice')}
        className="w-9 h-9 rounded-full bg-forest text-cream flex items-center justify-center hover:bg-leaf transition-colors shadow-sm cursor-pointer"
        title="Voice Assistant"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
        </svg>
      </button>

      {/* Alerts */}
      <button
        onClick={() => setView('alerts')}
        className="relative w-9 h-9 rounded-full hover:bg-mist flex items-center justify-center text-sage hover:text-charcoal transition-colors cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-harvest rounded-full" />
      </button>

      {/* Profile avatar */}
      <button
        onClick={() => setView('settings')}
        className="w-8 h-8 rounded-full bg-forest text-cream text-sm font-medium flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer uppercase overflow-hidden"
        title={user?.full_name || 'Profile'}
      >
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          userInitial
        )}
      </button>
    </header>
  )
}
