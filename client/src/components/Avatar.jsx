export default function Avatar({ user, size = 24, ring = false, presence = false, className = '' }) {
  const name = user?.name || user?.email || '?'
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <span className={`relative inline-flex shrink-0 ${className}`} title={name}>
      <span
        className={`flex items-center justify-center rounded-full font-semibold text-white ${ring ? 'ring-2 ring-white' : ''}`}
        style={{
          width: size,
          height: size,
          background: `linear-gradient(140deg, ${user?.avatarColor || '#6366f1'}, ${shade(user?.avatarColor || '#6366f1')})`,
          fontSize: Math.max(9, size * 0.4),
        }}
      >
        {initials}
      </span>
      {presence && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-emerald-500"
          style={{ width: Math.max(7, size * 0.32), height: Math.max(7, size * 0.32) }}
        />
      )}
    </span>
  )
}

function shade(hex) {
  try {
    const n = parseInt(hex.replace('#', ''), 16)
    const r = Math.max(0, ((n >> 16) & 255) - 34)
    const g = Math.max(0, ((n >> 8) & 255) - 34)
    const b = Math.max(0, (n & 255) - 34)
    return `rgb(${r}, ${g}, ${b})`
  } catch {
    return hex
  }
}
