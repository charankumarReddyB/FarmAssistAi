interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
  textClass?: string
  variant?: 'default' | 'light' | 'dark'
}

export function Logo({ size = 36, className = '', showText = true, textClass = '', variant = 'default' }: LogoProps) {
  const iconColor = variant === 'light' ? '#f7f3ed' : '#1f4d2f'
  const leafAccent = variant === 'light' ? 'rgba(247,243,237,0.25)' : 'rgba(58,125,78,0.15)'
  const textColor = variant === 'light' ? 'text-cream' : 'text-forest'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer leaf shape */}
        <path
          d="M20 36C20 36 7 27 7 17C7 9.268 12.82 4 20 4C27.18 4 33 9.268 33 17C33 27 20 36 20 36Z"
          fill={iconColor}
        />
        {/* Inner grain lines — left */}
        <path
          d="M20 17 L14 12"
          stroke={leafAccent}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M20 22 L14 18"
          stroke={leafAccent}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Inner grain lines — right */}
        <path
          d="M20 17 L26 12"
          stroke={leafAccent}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M20 22 L26 18"
          stroke={leafAccent}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Central vein */}
        <path
          d="M20 6 L20 34"
          stroke={variant === 'light' ? 'rgba(247,243,237,0.4)' : 'rgba(255,255,255,0.35)'}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* AI node — center circle */}
        <circle cx="20" cy="17" r="5" fill={variant === 'light' ? 'rgba(247,243,237,0.9)' : 'white'} />
        <circle cx="20" cy="17" r="2.5" fill={iconColor} />
        {/* AI node — surrounding dots */}
        <circle cx="20" cy="10.5" r="1.2" fill={variant === 'light' ? 'rgba(247,243,237,0.6)' : 'rgba(255,255,255,0.5)'} />
        <circle cx="26" cy="17" r="1.2" fill={variant === 'light' ? 'rgba(247,243,237,0.6)' : 'rgba(255,255,255,0.5)'} />
        <circle cx="14" cy="17" r="1.2" fill={variant === 'light' ? 'rgba(247,243,237,0.6)' : 'rgba(255,255,255,0.5)'} />
      </svg>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-display text-lg font-normal tracking-tight ${textColor} ${textClass}`}>
            FarmAssist
          </span>
          <span className={`text-xs font-mono tracking-widest uppercase ${variant === 'light' ? 'text-cream/60' : 'text-sage'}`}>
            AI
          </span>
        </div>
      )}
    </div>
  )
}
