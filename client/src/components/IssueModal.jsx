import { useState } from 'react'
import { api } from '../lib/api'
import { STATUSES, PRIORITIES } from '../lib/constants'

export default function IssueModal({ issue, project, onClose, onSaved }) {
  const members = project?.team?.members?.map((m) => m.user) || []
  const labels = project?.labels || []
  const [form, setForm] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    status: issue?.status || 'BACKLOG',
    priority: issue?.priority || 'NONE',
    assigneeId: issue?.assigneeId || '',
  })
  const [labelIds, setLabelIds] = useState(issue?.labels?.map((l) => l.label.id) || [])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title.trim()) return setError('Title is required')
    setError('')
    setBusy(true)
    try {
      let saved
      if (issue?.id) {
        saved = await api(`/issues/${issue.id}`, { method: 'PATCH', body: { ...form, assigneeId: form.assigneeId || null } })
      } else {
        saved = await api('/issues', { method: 'POST', body: { ...form, projectId: project.id, assigneeId: form.assigneeId || null } })
      }
      for (const id of labelIds) {
        if (!issue?.labels?.some((l) => l.label.id === id)) {
          await api(`/issues/${saved.id}/labels`, { method: 'POST', body: { labelId: id } })
        }
      }
      for (const l of issue?.labels || []) {
        if (!labelIds.includes(l.label.id)) {
          await api(`/issues/${saved.id}/labels/${l.label.id}`, { method: 'DELETE' })
        }
      }
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this issue?')) return
    await api(`/issues/${issue.id}`, { method: 'DELETE' })
    onSaved({ __deleted: true, id: issue.id })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[8vh] backdrop-blur-sm" onClick={onClose}>
      <div className="animate-pop-in w-full max-w-lg rounded-xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="text-sm font-semibold">{issue?.id ? 'Edit issue' : 'New issue'}</div>
          <button onClick={onClose} className="rounded px-2 py-1 text-faint hover:bg-raised hover:text-fg">Esc</button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Issue title"
            className="rounded-md border border-line bg-bg px-3 py-2 text-[15px] outline-none focus:border-accent"
          />
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Add a description…"
            rows={4}
            className="resize-none rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-muted">Status</span>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-accent">
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-muted">Priority</span>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-accent">
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[12px] font-medium text-muted">Assignee</span>
            <select value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)} className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-accent">
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-muted">Labels</span>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const on = labelIds.includes(l.id)
                return (
                  <button
                    key={l.id}
                    onClick={() => setLabelIds((ids) => (on ? ids.filter((x) => x !== l.id) : [...ids, l.id]))}
                    className={`rounded-full border px-2.5 py-0.5 text-[12px] transition-colors ${on ? 'border-transparent text-white' : 'border-line text-muted hover:text-fg'}`}
                    style={on ? { background: l.color } : {}}
                  >
                    {l.name}
                  </button>
                )
              })}
              {labels.length === 0 && <span className="text-[12px] text-faint">No labels yet</span>}
            </div>
          </div>

          {error && <div className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</div>}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          {issue?.id ? (
            <button onClick={remove} className="rounded-md px-3 py-1.5 text-sm text-danger hover:bg-danger/10">Delete</button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-raised">Cancel</button>
            <button onClick={save} disabled={busy} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
              {issue?.id ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
