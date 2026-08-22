import { useState } from 'react'
import { useApp } from '../App'

const FARM_MAP = 'https://images.unsplash.com/photo-1615829254885-d4bfd5ce700e?w=800&h=400&fit=crop&auto=format'

const HISTORY = [
  { season: 'Rabi 2025–26', crop: 'Wheat', result: 'Good', yield: '18 qtl/acre' },
  { season: 'Kharif 2025', crop: 'Paddy', result: 'Moderate', yield: '22 qtl/acre' },
  { season: 'Rabi 2024–25', crop: 'Groundnut', result: 'Excellent', yield: '8 qtl/acre' },
  { season: 'Kharif 2024', crop: 'Paddy', result: 'Good', yield: '20 qtl/acre' },
]

const RESULT_COLOR: Record<string, string> = {
  Excellent: 'text-meadow bg-meadow/10',
  Good: 'text-rain bg-rain/10',
  Moderate: 'text-harvest bg-harvest/10',
  Poor: 'text-risk bg-risk/10',
}

export function MyFarm() {
  const { t } = useApp()
  const [editing, setEditing] = useState(false)

  const fields = [
    { label: t('farm_size'), value: '4.2 acres', icon: '◈' },
    { label: t('farm_crop'), value: 'Paddy (Kharif 2026)', icon: '🌾' },
    { label: t('farm_soil_type'), value: 'Clay Loam', icon: '◎' },
    { label: t('farm_irrigation'), value: 'Drip + Sprinkler', icon: '💧' },
    { label: t('farm_sowing'), value: '15 June 2026', icon: '📅' },
    { label: t('farm_stage'), value: 'Vegetative Stage (Day 45)', icon: '🌱' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-charcoal">{t('farm_title')}</h1>
        <button
          onClick={() => setEditing(!editing)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            editing
              ? 'bg-forest text-cream'
              : 'border border-pebble text-charcoal hover:bg-mist'
          }`}
        >
          {editing ? `✓ ${t('save')}` : t('farm_edit')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map + location */}
        <div className="lg:col-span-2 space-y-5">
          {/* Farm map */}
          <div className="bg-charcoal rounded-xl overflow-hidden h-52 relative">
            <img
              src={FARM_MAP}
              alt="Aerial view of a green paddy field"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-end p-4">
              <div className="bg-charcoal/70 backdrop-blur-sm rounded-lg px-4 py-2 text-cream">
                <div className="text-xs text-cream/60 font-mono">Location</div>
                <div className="font-medium">Kakinada, East Godavari, AP</div>
                <div className="text-cream/60 text-xs font-mono">16.9891° N, 82.2475° E</div>
              </div>
            </div>
          </div>

          {/* Farm details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fields.map((field) => (
              <div key={field.label} className="bg-white border border-pebble rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg opacity-60">{field.icon}</span>
                  <span className="text-xs font-mono text-sage uppercase tracking-wide">{field.label}</span>
                </div>
                {editing ? (
                  <input
                    defaultValue={field.value}
                    className="w-full text-charcoal text-sm font-medium border-b border-leaf/40 bg-transparent focus:outline-none pb-0.5"
                  />
                ) : (
                  <div className="text-charcoal text-sm font-medium">{field.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Farmer profile */}
          <div className="bg-white border border-pebble rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full bg-forest text-cream text-2xl font-medium flex items-center justify-center">
                R
              </div>
              <div>
                <div className="font-medium text-charcoal">Raju Reddy</div>
                <div className="text-sage text-xs">Farmer · 18 yrs experience</div>
                <div className="text-sage text-xs">9876543210</div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sage">District</span>
                <span className="text-charcoal font-medium">East Godavari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage">Mandal</span>
                <span className="text-charcoal font-medium">Kakinada Rural</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage">Village</span>
                <span className="text-charcoal font-medium">Rajahmundry Road</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sage">Language</span>
                <span className="text-charcoal font-medium">Telugu</span>
              </div>
            </div>
          </div>

          {/* Farm history */}
          <div className="bg-white border border-pebble rounded-xl p-5">
            <h3 className="font-display text-lg text-charcoal mb-4">{t('farm_history')}</h3>
            <div className="space-y-2">
              {HISTORY.map((h) => (
                <div key={h.season} className="flex items-center justify-between py-2 border-b border-pebble/60 last:border-0">
                  <div>
                    <div className="text-charcoal text-sm font-medium">{h.crop}</div>
                    <div className="text-sage text-xs">{h.season}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${RESULT_COLOR[h.result]}`}>
                      {h.result}
                    </span>
                    <div className="text-sage text-xs mt-0.5">{h.yield}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
