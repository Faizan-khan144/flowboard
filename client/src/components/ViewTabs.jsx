import { NavLink } from 'react-router-dom'
import { LayoutGrid, List, CalendarRange, TrendingUp } from 'lucide-react'

const TABS = [
  { to: '/app/board', label: 'Board', icon: LayoutGrid },
  { to: '/app/issues', label: 'List', icon: List },
  { to: '/app/timeline', label: 'Timeline', icon: CalendarRange },
  { to: '/app/analytics', label: 'Analytics', icon: TrendingUp },
]

export default function ViewTabs() {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-raised/60 p-1">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200 ${
              isActive ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-3.5 w-3.5 transition-transform duration-300 ${isActive ? 'scale-110 text-accent' : ''}`} />
              <span className="hidden sm:inline">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}
