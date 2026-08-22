type StatusLevel = 'low' | 'normal' | 'high' | 'optimal' | 'good' | 'warning' | 'danger' | 'info'

interface StatusBadgeProps {
  level: StatusLevel
  label: string
  showDot?: boolean
  size?: 'sm' | 'md'
}

const STATUS_STYLES: Record<StatusLevel, { bg: string; text: string; dot: string }> = {
  low: { bg: 'bg-risk/10', text: 'text-risk', dot: 'bg-risk' },
  danger: { bg: 'bg-risk/10', text: 'text-risk', dot: 'bg-risk' },
  warning: { bg: 'bg-harvest/15', text: 'text-harvest', dot: 'bg-harvest' },
  high: { bg: 'bg-harvest/15', text: 'text-harvest', dot: 'bg-harvest' },
  normal: { bg: 'bg-rain/10', text: 'text-rain', dot: 'bg-rain' },
  info: { bg: 'bg-rain/10', text: 'text-rain', dot: 'bg-rain' },
  optimal: { bg: 'bg-meadow/12', text: 'text-meadow', dot: 'bg-meadow' },
  good: { bg: 'bg-meadow/12', text: 'text-meadow', dot: 'bg-meadow' },
}

export function StatusBadge({ level, label, showDot = true, size = 'sm' }: StatusBadgeProps) {
  const styles = STATUS_STYLES[level]
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded font-mono font-medium tracking-wide ${styles.bg} ${styles.text} ${sizeClass}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />}
      {label}
    </span>
  )
}

interface RiskBadgeProps {
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  label?: string
}

export function RiskBadge({ level, label }: RiskBadgeProps) {
  const styles = {
    HIGH: 'bg-risk/10 text-risk border-risk/20',
    MEDIUM: 'bg-harvest/10 text-harvest border-harvest/20',
    LOW: 'bg-meadow/10 text-meadow border-meadow/20',
  }[level]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border text-xs font-mono font-semibold tracking-widest px-2 py-0.5 ${styles}`}>
      {label ?? level}
    </span>
  )
}

interface AiBadgeProps {
  verified?: boolean
  label?: string
}

export function AiBadge({ verified = false, label }: AiBadgeProps) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-meadow bg-meadow/10 rounded px-2 py-0.5 border border-meadow/20">
        <span>✓</span>
        {label ?? 'Expert Verified'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-rain bg-rain/8 rounded px-2 py-0.5 border border-rain/15">
      <span>◈</span>
      {label ?? 'AI Analysis'}
    </span>
  )
}
