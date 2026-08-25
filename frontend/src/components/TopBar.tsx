import { useState, useEffect } from 'react'
import { useApp } from '../App'

export function TopBar() {
  const { t, setView } = useApp()
  const [temp, setTemp] = useState<number | string>('32°C')
  const [userLocation, setUserLocation] = useState<string>('Kakinada, Andhra Pradesh')

  useEffect(() => {
    // Read saved user location
    const userJson = localStorage.getItem('farmassist_user')
    if (userJson) {
      try {
        const userObj = JSON.parse(userJson)
        if (userObj.district && userObj.state) {
          setUserLocation(`${userObj.district}, ${userObj.state}`)
        }
      } catch (e) {}
    }

    // Fetch live location weather from backend
    fetch('http://127.0.0.1:8000/api/weather')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.temperature !== undefined) {
          setTemp(`${data.temperature}°C`)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <header className="flex-shrink-0 h-14 bg-cream border-b border-pebble flex items-center px-6 gap-4">
      {/* Farm location */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sage text-sm">📍</span>
        <span className="text-charcoal text-sm font-semibold truncate">{userLocation}</span>
        <span className="text-pebble text-xs mx-1">·</span>
        <span className="text-sage text-xs truncate">{t('dash_current_crop')}</span>
      </div>

      <div className="flex-1" />

      {/* Weather shortcut */}
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-1.5 text-sm text-charcoal/80 hover:text-charcoal transition-colors px-2.5 py-1 rounded-md bg-mist/60 border border-pebble/40 cursor-pointer"
      >
        <span>⛅</span>
        <span className="font-mono font-semibold text-xs">{temp}</span>
      </button>

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
      <button onClick={() => setView('settings')} className="w-8 h-8 rounded-full bg-forest text-cream text-sm font-medium flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
        R
      </button>
    </header>
  )
}
