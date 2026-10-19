export default function ProgressRing({ percent = 0, size = 92, stroke = 9, color = '#5b5bd6', label, sub }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9eaf0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="ring-draw"
          style={{ '--ring-from': `${c}`, transition: 'stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[19px] font-bold leading-none">{label ?? `${percent}%`}</span>
        {sub && <span className="mt-1 text-[11px] text-faint">{sub}</span>}
      </div>
    </div>
  )
}
