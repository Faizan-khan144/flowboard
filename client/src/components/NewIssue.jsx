import { useEffect, useMemo, useState } from 'react'
import { X, Paperclip, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { STATUSES, PRIORITIES } from '../lib/constants'
import Avatar from './Avatar'

export default function NewIssue({ open, onClose, team, defaultProjectId, defaultStatus, onCreated }) {
  const { user } = useAuth()
  const toast = useUI((s) => s.toast)
  const projects = team?.projects || []

  const validDefault = (id) => (projects.some((p) => p.id === id) ? id : projects[0]?.id || '')
  const [form, setForm] = useState({
    projectId: validDefault(defaultProjectId),
    title: '',
    description: '',
    status: defaultStatus || 'BACKLOG',
    priority: 'NONE',
    assigneeId: '',
    estimate: '',
    dueDate: '',
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setForm((f) => ({
        ...f,
        projectId: validDefault(defaultProjectId) || validDefault(f.projectId),
        status: defaultStatus || f.status,
        title: '',
        description: '',
      }))
    }
  }, [open, defaultProjectId, defaultStatus, projects.length])

  const project = useMemo(() => projects.find((p) => p.id === form.projectId) || projects[0], [projects, form.projectId])
  const members = team?.members || []

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function submit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.projectId) return
    setBusy(true)
    try {
      const issue = await api('/issues', {
        method: 'POST',
        body: {
          projectId: form.projectId,
          title: form.title.trim(),
          description: form.description || null,
          status: form.status,
          priority: form.priority,
          assigneeId: form.assigneeId || null,
          estimate: form.estimate === '' ? null : Number(form.estimate),
          dueDate: form.dueDate || null,
        },
      })
      toast(`${project?.key}-${issue.number} created`, { tone: 'success' })
      onCreated?.(issue)
      onClose()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-start justify-center overflow-y-auto px-4 py-14" onMouseDown={onClose}>
      <div className="drawer-scrim fixed inset-0 bg-slate-900/25 backdrop-blur-[2px]" />
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="cmd-in relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-white shadow-2xl shadow-slate-900/20"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2 text-[13.5px] font-medium">
            <Sparkles className="h-4 w-4 text-accent" /> New issue
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-faint transition-colors hover:bg-raised hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Issue title — what needs to happen?"
            className="w-full bg-transparent text-[19px] font-semibold outline-none placeholder:text-faint"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Add context, steps to reproduce, or a link…"
            className="mt-3 w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-3 text-[14px] outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Project">
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="app-input w-full px-3 py-2.5 text-[13.5px]">
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="app-input w-full px-3 py-2.5 text-[13.5px]">
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="app-input w-full px-3 py-2.5 text-[13.5px]">
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assignee">
              <div className="flex items-center gap-2">
                <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })} className="app-input w-full px-3 py-2.5 text-[13.5px]">
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                      {m.user.id === user?.id ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
                {form.assigneeId && <Avatar size={28} user={members.find((m) => m.user.id === form.assigneeId)?.user} />}
              </div>
            </Field>
            <Field label="Estimate (points)">
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.estimate}
                onChange={(e) => setForm({ ...form, estimate: e.target.value })}
                placeholder="—"
                className="app-input w-full px-3 py-2.5 text-[13.5px]"
              />
            </Field>
            <Field label="Due date">
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="app-input w-full px-3 py-2.5 text-[13.5px]" />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line bg-bg px-5 py-3.5">
          <span className="flex items-center gap-1.5 text-[12px] text-faint">
            <Paperclip className="h-3.5 w-3.5" /> Tip: press <span className="kbd">C</span> anywhere to compose
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="app-btn app-btn-ghost px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={busy || !form.title.trim()} className="app-btn app-btn-primary px-5 py-2 disabled:opacity-50">
              {busy ? 'Creating…' : 'Create issue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}
