import { useState } from 'react'
import { useApp } from '../App'
import { StatusBadge, AiBadge } from '../components/StatusBadge'

type Filter = 'all' | 'soil' | 'crop' | 'advisory'

const REPORTS = [
  {
    id: 1,
    date: '12 Aug 2026',
    type: 'soil' as const,
    crop: 'Paddy',
    status: 'warning' as const,
    statusLabel: 'Needs Attention',
    result: 'Soil Health: 72/100. Low nitrogen, alkaline pH.',
    verified: true,
  },
  {
    id: 2,
    date: '08 Aug 2026',
    type: 'crop' as const,
    crop: 'Tomato',
    status: 'warning' as const,
    statusLabel: 'Possible Disease',
    result: 'Early Blight detected with 92% confidence. Moderate severity.',
    verified: false,
  },
  {
    id: 3,
    date: '05 Aug 2026',
    type: 'advisory' as const,
    crop: 'Paddy',
    status: 'optimal' as const,
    statusLabel: 'Advisory Updated',
    result: 'Weekly advisory generated. 6 recommended actions.',
    verified: true,
  },
  {
    id: 4,
    date: '28 Jul 2026',
    type: 'soil' as const,
    crop: 'Paddy',
    status: 'normal' as const,
    statusLabel: 'Normal',
    result: 'Soil Health: 81/100. Phosphorus slightly elevated.',
    verified: true,
  },
  {
    id: 5,
    date: '20 Jul 2026',
    type: 'crop' as const,
    crop: 'Paddy',
    status: 'optimal' as const,
    statusLabel: 'Healthy',
    result: 'No disease detected. Crop health: Excellent.',
    verified: false,
  },
  {
    id: 6,
    date: '12 Jul 2026',
    type: 'advisory' as const,
    crop: 'Paddy',
    status: 'optimal' as const,
    statusLabel: 'Advisory Updated',
    result: 'Monthly advisory. Irrigation schedule optimized.',
    verified: true,
  },
]

const TYPE_ICON: Record<string, string> = {
  soil: '◎',
  crop: '⬢',
  advisory: '◐',
}

const TYPE_COLOR: Record<string, string> = {
  soil: 'text-rain bg-rain/8 border-rain/20',
  crop: 'text-leaf bg-leaf/8 border-leaf/20',
  advisory: 'text-forest bg-forest/8 border-forest/20',
}

export function Reports() {
  const { t, setView } = useApp()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = filter === 'all' ? REPORTS : REPORTS.filter((r) => r.type === filter)
  const filterKeys: Filter[] = ['all', 'soil', 'crop', 'advisory']

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-charcoal">{t('reports_title')}</h1>
        <div className="text-sage text-sm font-mono">{REPORTS.length} reports</div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-mist rounded-xl p-1 w-fit">
        {filterKeys.map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === key ? 'bg-white text-charcoal shadow-sm' : 'text-sage hover:text-charcoal'
            }`}
          >
            {t(`reports_${key}`)}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-pebble" />
        <div className="space-y-4">
          {filtered.map((report) => (
            <div key={report.id} className="relative pl-12">
              {/* Timeline dot */}
              <div className={`absolute left-3.5 top-5 w-3 h-3 rounded-full border-2 border-cream ${
                report.type === 'soil' ? 'bg-rain' : report.type === 'crop' ? 'bg-leaf' : 'bg-forest'
              }`} />

              <div className="bg-white border border-pebble rounded-xl p-4 hover:border-leaf/40 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${TYPE_COLOR[report.type]}`}>
                        {TYPE_ICON[report.type]} {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </span>
                      <StatusBadge level={report.status} label={report.statusLabel} />
                      {report.verified && <AiBadge verified label="Expert Verified" />}
                    </div>

                    {/* Date + crop */}
                    <div className="flex items-center gap-2 text-xs text-sage mb-2">
                      <span>{report.date}</span>
                      <span className="text-pebble">·</span>
                      <span>{report.crop}</span>
                    </div>

                    {/* Result summary */}
                    <p className="text-charcoal/80 text-sm">{report.result}</p>
                  </div>

                  <button
                    onClick={() => setView(report.type === 'soil' ? 'soil' : report.type === 'crop' ? 'crop' : 'advisory')}
                    className="text-xs text-leaf border border-leaf/30 px-3 py-1.5 rounded-lg hover:bg-leaf/8 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    {t('reports_view')} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
