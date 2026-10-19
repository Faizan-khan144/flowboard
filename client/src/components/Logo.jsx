export default function Logo({ size = 32, withWord = true, wordClass = 'text-[16px]' }) {
  return (
    <span className="inline-flex select-none items-center gap-2.5">
      <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="fb-logo-mark"
          aria-label="Flowboard logo"
        >
          <defs>
            <linearGradient id="fb-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6d6df0" />
              <stop offset="52%" stopColor="#5b5bd6" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
            <linearGradient id="fb-gloss" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stop-opacity="0.32" />
              <stop offset="100%" stopColor="#ffffff" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="fb-dot" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
          </defs>

          <rect width="40" height="40" rx="11" fill="url(#fb-grad)" />
          <path d="M0 11C0 4.92487 4.92487 0 11 0H29C35.0751 0 40 4.92487 40 11V18H0V11Z" fill="url(#fb-gloss)" />

          <rect className="fb-bar fb-bar-1" x="9" y="9" width="16" height="6" rx="3" fill="#ffffff" />
          <rect className="fb-bar fb-bar-2" x="9" y="17.5" width="11" height="6" rx="3" fill="#ffffff" fillOpacity="0.92" />
          <rect className="fb-bar fb-bar-3" x="9" y="26" width="7" height="6" rx="3" fill="#ffffff" fillOpacity="0.8" />

          <circle className="fb-dot" cx="29.5" cy="29" r="3.6" fill="url(#fb-dot)" />
        </svg>
      </span>
      {withWord && (
        <span className={`font-bold leading-none tracking-tight ${wordClass}`}>
          Flow<span className="font-medium text-muted">board</span>
        </span>
      )}
    </span>
  )
}
