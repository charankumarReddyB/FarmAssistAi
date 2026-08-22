import { useState } from 'react'
import { useApp } from '../App'
import { RiskBadge } from '../components/StatusBadge'

interface Alert {
  id: number
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  detail: string
  action: string
  time: string
  read: boolean
  category: string
}

const INITIAL_ALERTS: Alert[] = [
  {
    id: 1,
    level: 'HIGH',
    title: 'Possible crop disease detected',
    detail: 'Early Blight identified in your tomato field with 92% confidence. Moderate severity affecting approximately 15% of visible crop area.',
    action: 'Apply copper-based fungicide and inspect affected plants today.',
    time: '2 hours ago',
    read: false,
    category: 'crop',
  },
  {
    id: 2,
    level: 'MEDIUM',
    title: 'Rain expected tomorrow',
    detail: '78% probability of rainfall forecast for Kakinada tomorrow morning. Estimated 12–18 mm accumulation.',
    action: 'Postpone planned irrigation and check field drainage.',
    time: '5 hours ago',
    read: false,
    category: 'weather',
  },
  {
    id: 3,
    level: 'MEDIUM',
    title: 'Nitrogen deficiency — soil report',
    detail: 'Your latest soil analysis shows nitrogen levels at 142 kg/ha, well below the recommended 280–560 kg/ha range for Kharif paddy.',
    action: 'Review fertilizer recommendation and consult agricultural officer.',
    time: '1 day ago',
    read: false,
    category: 'soil',
  },
  {
    id: 4,
    level: 'LOW',
    title: 'New advisory available',
    detail: 'Your personalized farm advisory for this week has been updated based on your recent soil report and weather forecast.',
    action: 'Open My Advisories to review and act on recommendations.',
    time: '2 days ago',
    read: true,
    category: 'advisory',
  },
  {
    id: 5,
    level: 'LOW',
    title: 'Expert review completed',
    detail: "Your soil analysis report from August 12 has been reviewed and verified by Dr. Anand Sharma, Agricultural Soil Scientist.",
    action: 'View expert comments in your soil analysis report.',
    time: '3 days ago',
    read: true,
    category: 'expert',
  },
]

const CATEGORY_ICON: Record<string, string> = {
  crop: '⬢',
  weather: '⛅',
  soil: '◎',
  advisory: '◐',
  expert: '◈',
}

export function Alerts() {
  const { t, setView } = useApp()
  const [alerts, setAlerts] = useState(INITIAL_ALERTS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const markRead = (id: number) =>
    setAlerts((a) => a.map((al) => al.id === id ? { ...al, read: true } : al))

  const markAllRead = () =>
    setAlerts((a) => a.map((al) => ({ ...al, read: true })))

  const displayed = filter === 'all' ? alerts : alerts.filter((a) => !a.read)
  const unreadCount = alerts.filter((a) => !a.read).length

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-charcoal">{t('alerts_title')}</h1>
          {unreadCount > 0 && (
            <p className="text-sage text-sm mt-1">
              <span className="text-harvest font-medium">{unreadCount} unread</span> alerts require your attention
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-sage hover:text-charcoal border border-pebble rounded-lg px-3 py-1.5 hover:bg-mist transition-all"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-mist rounded-xl p-1 w-fit">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f ? 'bg-white text-charcoal shadow-sm' : 'text-sage hover:text-charcoal'
            }`}
          >
            {f === 'all' ? 'All Alerts' : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {displayed.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white border rounded-xl p-5 transition-all ${
              alert.read
                ? 'border-pebble opacity-70'
                : alert.level === 'HIGH'
                ? 'border-risk/30 shadow-sm'
                : alert.level === 'MEDIUM'
                ? 'border-harvest/30'
                : 'border-pebble'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Category icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                alert.level === 'HIGH' ? 'bg-risk/10 text-risk' :
                alert.level === 'MEDIUM' ? 'bg-harvest/10 text-harvest' :
                'bg-mist text-sage'
              }`}>
                {CATEGORY_ICON[alert.category]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <RiskBadge level={alert.level} />
                  <span className="text-charcoal font-semibold text-sm">{alert.title}</span>
                  {!alert.read && (
                    <span className="w-2 h-2 rounded-full bg-harvest flex-shrink-0" />
                  )}
                </div>
                <p className="text-charcoal/75 text-sm leading-relaxed mb-2">{alert.detail}</p>
                <div className="bg-mist rounded-lg px-3 py-2">
                  <span className="text-sage text-xs font-mono uppercase tracking-wide mr-2">Action:</span>
                  <span className="text-charcoal text-xs">{alert.action}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-sage text-xs font-mono">{alert.time}</span>
                {!alert.read && (
                  <button
                    onClick={() => markRead(alert.id)}
                    className="text-xs text-sage hover:text-charcoal border border-pebble rounded px-2 py-1 hover:bg-mist transition-all"
                  >
                    {t('alerts_mark_read')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {displayed.length === 0 && (
          <div className="text-center py-16 text-sage">
            <div className="text-4xl mb-3 opacity-40">◉</div>
            <div className="text-sm">No {filter === 'unread' ? 'unread ' : ''}alerts</div>
          </div>
        )}
      </div>
    </div>
  )
}
