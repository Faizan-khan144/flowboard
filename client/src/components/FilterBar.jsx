import { useEffect, useRef, useState } from 'react'
import { Search, SlidersHorizontal, ChevronDown, Check, X, Users, Tag, CircleDot, Layers, ArrowUpDown, Bookmark, Download, RotateCcw } from 'lucide-react'
import { STATUSES, PRIORITIES } from '../lib/constants'
import Avatar from './Avatar'

const SORTS = [
  ['updated', 'Last updated'],
  ['created', 'Created'],
  ['priority', 'Priority'],
  ['status', 'Status'],
  ['due', 'Due date'],
  ['estimate', 'Estimate'],
  ['title', 'Title'],
  ['number', 'Issue number'],
]

const GROUPS = [
  ['none', 'No grouping'],
  ['status', 'Status'],
  ['priority', 'Priority'],
  ['assignee', 'Assignee'],
  ['project', 'Project'],
  ['label', 'Label'],
]

export default function FilterBar({ filters, onChange, team, onSaveView, onExport, compact }) {
  const [openMenu, setOpenMenu] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const set = (patch) => onChange({ ...filters, ...patch })
  const toggle = (key, value) => {
    const list = filters[key] || []
    set({ [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }

  const members = team?.members || []
  const labels = team?.labels || []
  const projects = team?.projects || []

  const activeCount =
    (filters.status?.length || 0) +
    (filters.priority?.length || 0) +
    (filters.assignee?.length || 0) +
    (filters.label?.length || 0) +
    (filters.project?.length || 0) +
    (filters.due ? 1 : 0)

  return (
    <div ref={wrapRef} className="relative z-30 flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
        <input
          value={filters.q || ''}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Filter issues…"
          className="app-input h-9 w-[190px] pl-8 pr-7 text-[13px] lg:w-[240px]"
        />
        {filters.q && (
          <button onClick={() => set({ q: '' })} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-faint hover:text-fg">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <Menu
        open={openMenu === 'status'}
        onToggle={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
        icon={CircleDot}
        label={filters.status?.length ? `Status · ${filters.status.length}` : 'Status'}
        active={filters.status?.length > 0}
      >
        {STATUSES.map((s) => (
          <Row key={s.id} checked={filters.status?.includes(s.id)} onClick={() => toggle('status', s.id)}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
          </Row>
        ))}
      </Menu>

      <Menu
        open={openMenu === 'priority'}
        onToggle={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')}
        icon={SlidersHorizontal}
        label={filters.priority?.length ? `Priority · ${filters.priority.length}` : 'Priority'}
        active={filters.priority?.length > 0}
      >
        {PRIORITIES.map((p) => (
          <Row key={p.id} checked={filters.priority?.includes(p.id)} onClick={() => toggle('priority', p.id)}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /> {p.label} <span className="text-faint">({p.short})</span>
          </Row>
        ))}
      </Menu>

      <Menu
        open={openMenu === 'assignee'}
        onToggle={() => setOpenMenu(openMenu === 'assignee' ? null : 'assignee')}
        icon={Users}
        label={filters.assignee?.length ? `Assignee · ${filters.assignee.length}` : 'Assignee'}
        active={filters.assignee?.length > 0}
      >
        <Row checked={filters.assignee?.includes('me')} onClick={() => toggle('assignee', 'me')}>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">Y</span> Assigned to me
        </Row>
        <Row checked={filters.assignee?.includes('none')} onClick={() => toggle('assignee', 'none')}>
          <span className="h-5 w-5 rounded-full border border-dashed border-line" /> Unassigned
        </Row>
        <div className="my-1 border-t border-line" />
        {members.map((m) => (
          <Row key={m.user.id} checked={filters.assignee?.includes(m.user.id)} onClick={() => toggle('assignee', m.user.id)}>
            <Avatar user={m.user} size={20} /> {m.user.name}
          </Row>
        ))}
      </Menu>

      <Menu
        open={openMenu === 'label'}
        onToggle={() => setOpenMenu(openMenu === 'label' ? null : 'label')}
        icon={Tag}
        label={filters.label?.length ? `Labels · ${filters.label.length}` : 'Labels'}
        active={filters.label?.length > 0}
      >
        {labels.map((l) => (
          <Row key={l.id} checked={filters.label?.includes(l.id)} onClick={() => toggle('label', l.id)}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} /> {l.name}
          </Row>
        ))}
        {labels.length === 0 && <p className="px-3 py-2 text-[13px] text-faint">No labels yet</p>}
      </Menu>

      <Menu
        open={openMenu === 'more'}
        onToggle={() => setOpenMenu(openMenu === 'more' ? null : 'more')}
        icon={Layers}
        label={activeCount > 3 ? `More · ${activeCount - 3}` : 'More'}
        active={Boolean(filters.due) || (filters.project?.length || 0) > 0}
      >
        <Section title="Due date" />
        {[
          ['any', 'Any'],
          ['overdue', 'Overdue'],
          ['soon', 'Due in 7 days'],
          ['none', 'No due date'],
        ].map(([value, label]) => (
          <Row key={value} checked={(filters.due || 'any') === value} onClick={() => set({ due: value === 'any' ? null : value })}>
            {label}
          </Row>
        ))}
        <Section title="Project" />
        {projects.map((p) => (
          <Row key={p.id} checked={filters.project?.includes(p.id)} onClick={() => toggle('project', p.id)}>
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} /> {p.name}
          </Row>
        ))}
      </Menu>

      <Menu
        open={openMenu === 'sort'}
        onToggle={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
        icon={ArrowUpDown}
        label="Sort"
      >
        {SORTS.map(([value, label]) => (
          <Row key={value} checked={filters.sort === value} onClick={() => set({ sort: value })}>
            {label}
          </Row>
        ))}
        <div className="my-1 border-t border-line" />
        {[
          ['desc', 'Descending'],
          ['asc', 'Ascending'],
        ].map(([value, label]) => (
          <Row key={value} checked={(filters.dir || 'desc') === value} onClick={() => set({ dir: value })}>
            {label}
          </Row>
        ))}
      </Menu>

      {!compact && (
        <Menu
          open={openMenu === 'group'}
          onToggle={() => setOpenMenu(openMenu === 'group' ? null : 'group')}
          icon={Layers}
          label={filters.group && filters.group !== 'none' ? `Group · ${GROUPS.find(([g]) => g === filters.group)?.[1]}` : 'Group'}
          active={filters.group && filters.group !== 'none'}
        >
          {GROUPS.map(([value, label]) => (
            <Row key={value} checked={(filters.group || 'none') === value} onClick={() => set({ group: value })}>
              {label}
            </Row>
          ))}
        </Menu>
      )}

      {activeCount > 0 && (
        <button
          onClick={() => onChange({ ...filters, status: [], priority: [], assignee: [], label: [], project: [], due: null })}
          className="app-btn app-btn-ghost h-9 gap-1.5 px-3 text-[12.5px] text-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Clear
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        {onExport && (
          <button onClick={onExport} className="app-btn app-btn-ghost h-9 gap-1.5 px-3 text-[12.5px]">
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
          </button>
        )}
        {onSaveView && (
          <button onClick={onSaveView} className="app-btn app-btn-ghost h-9 gap-1.5 px-3 text-[12.5px]">
            <Bookmark className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Save view</span>
          </button>
        )}
      </div>
    </div>
  )
}

function Menu({ open, onToggle, icon: Icon, label, active, children }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`app-btn h-9 gap-1.5 px-3 text-[12.5px] transition-all ${
          active ? 'border border-accent/40 bg-accent/10 text-accent' : 'app-btn-ghost'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="dropdown-in thin-scroll absolute left-0 top-11 z-40 max-h-[320px] w-[230px] overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-2xl shadow-slate-900/15">
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ checked, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted transition-colors hover:bg-raised hover:text-fg"
    >
      <span className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${checked ? 'border-accent bg-accent text-white' : 'border-line'}`}>
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span className="flex flex-1 items-center gap-2">{children}</span>
    </button>
  )
}

function Section({ title }) {
  return <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-faint">{title}</div>
}
