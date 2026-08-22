import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { AiBadge, StatusBadge, RiskBadge } from '../components/StatusBadge'
import { LANG_LABELS } from '../translations'

type Tab = 'today' | 'week' | 'irrigation' | 'risk'

const TODAY_ACTIONS = [
  { time: 'Morning', action: 'Avoid overhead irrigation — rain expected tomorrow morning.', done: false, type: 'water' },
  { time: 'Morning', action: 'Inspect crop foliage for disease symptoms. Document leaf spots.', done: false, type: 'crop' },
  { time: 'Afternoon', action: 'Apply recommended fertilizer dosage (Urea 45 kg/acre or Tricyclazole 75% WP).', done: false, type: 'soil' },
  { time: 'Evening', action: 'Check Open-Meteo weather forecast update for local rainfall probability.', done: false, type: 'weather' },
]

const WEEK_ACTIONS = [
  { day: 'Tomorrow', action: 'Check actual rainfall measurement. Record in farm log.', type: 'weather' },
  { day: 'Day 3', action: 'Review nitrogen fertilizer application plan with agricultural extension officer.', type: 'soil' },
  { day: 'Day 4–5', action: 'Re-inspect crop for disease spread. Apply second protective dose if needed.', type: 'crop' },
  { day: 'This week', action: 'Consider applying Urea or MOP to correct soil nutrient deficiencies.', type: 'soil' },
  { day: 'This week', action: 'Collect soil sample for comprehensive lab analysis.', type: 'soil' },
]

const TYPE_COLOR: Record<string, string> = {
  water: 'text-rain bg-rain/8',
  crop: 'text-leaf bg-leaf/8',
  soil: 'text-harvest bg-harvest/8',
  weather: 'text-sage bg-mist',
}

interface AdvisoryItem {
  advisory_id: string
  source_type: string
  farmer_name?: string
  farmer_location?: string
  final_advisory: string
  original_ai_advisory: string
  status: string
  reviewed_by?: string
  expert_notes?: string
  reviewed_at?: string
  risk_level: string
  weather_impact?: string
}

export function Advisory() {
  const { t, lang, setLang } = useApp()
  const [tab, setTab] = useState<Tab>('today')
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [expertAdvisories, setExpertAdvisories] = useState<AdvisoryItem[]>([])

  const fetchAdvisories = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/expert/advisories')
      if (resp.ok) {
        const data = await resp.json()
        setExpertAdvisories(data)
      }
    } catch (err) {
      console.error('Failed to fetch advisories for farmer:', err)
    }
  }

  useEffect(() => {
    fetchAdvisories()
  }, [])

  const toggle = (i: number) => setChecked((p) => ({ ...p, [i]: !p[i] }))

  const latestAdv = expertAdvisories.length > 0 ? expertAdvisories[0] : null
  const advStatus = latestAdv?.status || 'pending_review'

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-charcoal">{t('advisory_title')}</h1>
          <p className="text-sage text-sm mt-1">Raju Reddy · Kakinada, AP · Paddy, Kharif 2026</p>
        </div>
        {/* Language toggle inside advisory */}
        <div className="flex items-center gap-1.5">
          <span className="text-sage text-xs mr-1">Advisory language:</span>
          <div className="flex items-center border border-pebble rounded-lg overflow-hidden">
            {(Object.keys(LANG_LABELS) as (keyof typeof LANG_LABELS)[]).map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                  lang === code ? 'bg-forest text-cream font-medium' : 'text-sage hover:text-charcoal hover:bg-mist'
                }`}
              >
                {LANG_LABELS[code]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expert Verification Status Banner */}
      <div className={`rounded-xl p-5 border shadow-sm transition-all ${
        advStatus === 'approved'
          ? 'bg-meadow/10 border-meadow/40 text-charcoal'
          : advStatus === 'modified'
          ? 'bg-rain/10 border-rain/40 text-charcoal'
          : advStatus === 'rejected'
          ? 'bg-risk/10 border-risk/40 text-charcoal'
          : 'bg-harvest/10 border-harvest/40 text-charcoal'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-3">
            {advStatus === 'approved' && (
              <span className="px-3 py-1 bg-meadow text-cream text-xs font-semibold rounded-full flex items-center gap-1">
                ✓ Expert Verified
              </span>
            )}
            {advStatus === 'modified' && (
              <span className="px-3 py-1 bg-rain text-cream text-xs font-semibold rounded-full flex items-center gap-1">
                ✏️ Expert Updated Recommendation
              </span>
            )}
            {advStatus === 'rejected' && (
              <span className="px-3 py-1 bg-risk text-cream text-xs font-semibold rounded-full flex items-center gap-1">
                ✕ Rejected by Expert
              </span>
            )}
            {(advStatus === 'pending_review' || advStatus === 'generated' || advStatus === 'under_review') && (
              <span className="px-3 py-1 bg-harvest text-cream text-xs font-semibold rounded-full flex items-center gap-1">
                ⏳ Pending Expert Review
              </span>
            )}
            {latestAdv?.reviewed_by && (
              <span className="text-sage text-xs font-mono">
                Reviewed by: {latestAdv.reviewed_by}
              </span>
            )}
          </div>
          <AiBadge label="Agricultural Advisory System" />
        </div>

        <p className="text-charcoal font-medium text-sm leading-relaxed mt-2">
          {latestAdv ? latestAdv.final_advisory : 'Your personalized farm advisory is generated using soil nutrient levels, crop image diagnosis, live Open-Meteo weather forecasts, and agricultural expert validation.'}
        </p>

        {latestAdv?.expert_notes && (
          <div className="mt-3 pt-3 border-t border-charcoal/10 text-xs text-charcoal/80 font-mono">
            <strong>Expert Notes:</strong> {latestAdv.expert_notes}
          </div>
        )}
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'advisory_soil_section', status: 'warning', icon: '◎', detail: 'N deficiency' },
          { key: 'advisory_crop_section', status: 'warning', icon: '⬢', detail: 'Early blight' },
          { key: 'advisory_water', status: 'optimal', icon: '💧', detail: 'Adequate' },
          { key: 'advisory_weather_section', status: 'normal', icon: '⛅', detail: 'Live Forecast' },
          { key: 'advisory_risk', status: 'warning', icon: '◉', detail: latestAdv?.risk_level || 'MODERATE' },
          { key: 'advisory_actions', status: 'optimal', icon: '◐', detail: '4 actions' },
        ].map((s) => (
          <div
            key={s.key}
            className="bg-white border border-pebble rounded-xl p-3 flex flex-col items-center text-center gap-1"
          >
            <span className="text-xl opacity-70">{s.icon}</span>
            <div className="text-charcoal text-xs font-medium leading-tight">{t(s.key)}</div>
            <StatusBadge
              level={s.status as 'warning' | 'optimal' | 'normal'}
              label={s.detail}
              showDot={false}
            />
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-mist rounded-xl p-1 w-fit flex-wrap">
        {([
          { id: 'today', label: t('advisory_today') },
          { id: 'week', label: t('advisory_week') },
          { id: 'irrigation', label: 'Irrigation' },
          { id: 'risk', label: 'Risk Analysis' },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === id
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-sage hover:text-charcoal'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action timeline */}
        <div className="lg:col-span-2">
          {tab === 'today' ? (
            <div className="space-y-3">
              <h2 className="font-display text-xl text-charcoal">{t('advisory_actions')}</h2>
              {TODAY_ACTIONS.map((action, i) => (
                <div
                  key={i}
                  className={`bg-white border border-pebble rounded-xl p-4 flex items-start gap-4 transition-all ${
                    checked[i] ? 'opacity-50' : ''
                  }`}
                >
                  <button
                    onClick={() => toggle(i)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                      checked[i] ? 'border-meadow bg-meadow text-cream' : 'border-pebble hover:border-leaf'
                    }`}
                  >
                    {checked[i] && <span className="text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${TYPE_COLOR[action.type]}`}>
                        {action.type}
                      </span>
                      <span className="text-sage text-xs font-mono">{action.time}</span>
                    </div>
                    <p className={`text-sm text-charcoal leading-relaxed ${checked[i] ? 'line-through text-sage' : ''}`}>
                      {action.action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'week' ? (
            <div className="space-y-3">
              <h2 className="font-display text-xl text-charcoal">{t('advisory_week')}</h2>
              {WEEK_ACTIONS.map((action, i) => (
                <div key={i} className="bg-white border border-pebble rounded-xl p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded uppercase ${TYPE_COLOR[action.type]}`}>
                        {action.type}
                      </span>
                      <span className="text-sage text-xs font-mono">{action.day}</span>
                    </div>
                    <p className="text-sm text-charcoal leading-relaxed">{action.action}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === 'irrigation' ? (
            <div className="bg-white border border-pebble rounded-xl p-5 space-y-4">
              <h2 className="font-display text-xl text-charcoal">Irrigation & Water Management Plan</h2>
              <p className="text-charcoal/80 text-sm leading-relaxed">
                {latestAdv?.weather_impact || 'Current rainfall forecast is light. Maintain standard drip irrigation depth.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-pebble rounded-xl p-5 space-y-4">
              <h2 className="font-display text-xl text-charcoal">Agronomic Risk Analysis</h2>
              <div className="space-y-2">
                <div className="p-3 bg-risk/10 rounded-lg text-xs text-charcoal font-medium">
                  • Low Nitrogen Risk: Stunted vegetative expansion and leaf yellowing.
                </div>
                <div className="p-3 bg-harvest/10 rounded-lg text-xs text-charcoal font-medium">
                  • Fungal Spore Spread Risk: High atmospheric humidity accelerates spore germination.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-white border border-pebble rounded-xl p-5 space-y-3">
            <h3 className="font-display text-lg text-charcoal">Farm Overview</h3>
            <div className="space-y-2 text-xs text-charcoal/80">
              <div className="flex justify-between border-b border-pebble/40 pb-1.5">
                <span className="text-sage">Farmer Name:</span>
                <span className="font-medium">Raju Reddy</span>
              </div>
              <div className="flex justify-between border-b border-pebble/40 pb-1.5">
                <span className="text-sage">Location:</span>
                <span className="font-medium">Kakinada, Andhra Pradesh</span>
              </div>
              <div className="flex justify-between border-b border-pebble/40 pb-1.5">
                <span className="text-sage">Preferred Language:</span>
                <span className="font-mono font-bold uppercase text-forest">{lang}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-sage">Advisory Status:</span>
                <span className="font-semibold uppercase text-meadow">{advStatus.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
