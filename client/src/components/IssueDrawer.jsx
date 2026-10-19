import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Trash2, Link2, Eye, EyeOff, Send, Pencil, Check, MessageSquare, Activity as ActivityIcon,
  CalendarDays, Timer, Target, Tag, UserCircle2, Layers, CornerDownRight, SmilePlus, Loader2,
} from 'lucide-react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import { STATUSES, PRIORITIES, REACTIONS, statusMeta, priorityMeta, relativeTime, dueMeta } from '../lib/constants'
import { issueKey, initials } from '../lib/utils'
import Avatar from './Avatar'

const ACTION_TEXT = {
  created: (a) => `created this issue`,
  status: (a, f, t) => `moved it from ${f} to ${t}`,
  priority: (a, f, t) => `changed priority from ${f} to ${t}`,
  assigneeId: (a, f, t) => `assigned it to ${t === 'unassigned' ? 'nobody' : t}`,
  title: () => `renamed the issue`,
  description: () => `updated the description`,
  cycleId: (a, f, t) => `set cycle to ${t}`,
  estimate: (a, f, t) => `set estimate to ${t}`,
  dueDate: (a, f, t) => `set due date to ${t}`,
  comment: (a, f, t) => `commented: “${t}”`,
  label: () => `changed labels`,
  member_joined: (a, f, t) => `joined the workspace`,
  workspace_created: (a, f, t) => `created the workspace`,
  project_created: (a, f, t) => `created project ${t}`,
}

export default function IssueDrawer({ issueId, team, onClose, onChanged }) {
  const { user } = useAuth()
  const toast = useUI((s) => s.toast)
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [titleDraft, setTitleDraft] = useState('')
  const [descDraft, setDescDraft] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [pickerTarget, setPickerTarget] = useState(null)
  const scrollRef = useRef(null)

  const members = team?.members || []
  const cycles = team?.projects?.find((p) => p.id === issue?.projectId)?.cycles || []
  const activeProject = team?.projects?.find((p) => p.id === issue?.projectId)
  const projectLabels = team?.labels || []

  async function load() {
    try {
      const data = await api(`/issues/${issueId}`)
      setIssue(data)
      setTitleDraft(data.title)
      setDescDraft(data.description || '')
    } catch (err) {
      toast(err.message, { tone: 'error' })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [issueId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const refresh = () => load()
    const onComment = (payload) => {
      if (payload.issueId === issueId) load()
    }
    const onReaction = (payload) => {
      if (payload.issueId === issueId) load()
    }
    socket.on('issue:updated', refresh)
    socket.on('comment:created', onComment)
    socket.on('comment:updated', onComment)
    socket.on('comment:deleted', onComment)
    socket.on('reaction:updated', onReaction)
    return () => {
      socket.off('issue:updated', refresh)
      socket.off('comment:created', onComment)
      socket.off('comment:updated', onComment)
      socket.off('comment:deleted', onComment)
      socket.off('reaction:updated', onReaction)
    }
  }, [issueId])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const onSet = (e) => patch({ status: e.detail })
    window.addEventListener('fb:set-status', onSet)
    return () => window.removeEventListener('fb:set-status', onSet)
  }, [issue])

  async function patch(data, quiet) {
    if (!issue) return
    const prev = issue
    setIssue({ ...issue, ...data })
    try {
      const updated = await api(`/issues/${issue.id}`, { method: 'PATCH', body: data })
      setIssue((cur) => ({ ...cur, ...updated }))
      onChanged?.()
      if (!quiet) toast('Issue updated')
    } catch (err) {
      setIssue(prev)
      toast(err.message, { tone: 'error' })
    }
  }

  async function saveTitle() {
    if (!issue || titleDraft.trim() === issue.title) return
    await patch({ title: titleDraft.trim() }, true)
  }

  async function saveDesc() {
    setEditingDesc(false)
    if (descDraft === (issue.description || '')) return
    await patch({ description: descDraft }, true)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setBusy(true)
    try {
      await api(`/issues/${issue.id}/comments`, { method: 'POST', body: { body: comment.trim() } })
      setComment('')
      await load()
      onChanged?.()
    } catch (err) {
      toast(err.message, { tone: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function saveCommentEdit(id) {
    await api(`/issues/${issue.id}/comments/${id}`, { method: 'PATCH', body: { body: commentDraft } })
    setEditingComment(null)
    load()
  }

  async function deleteComment(id) {
    await api(`/issues/${issue.id}/comments/${id}`, { method: 'DELETE' })
    load()
  }

  async function react(emoji, commentId) {
    const path = commentId
      ? `/issues/${issue.id}/comments/${commentId}/reactions`
      : `/issues/${issue.id}/reactions`
    const res = await api(path, { method: 'POST', body: { emoji } })
    if (commentId) {
      setIssue((cur) => ({
        ...cur,
        comments: cur.comments.map((c) => (c.id === commentId ? { ...c, reactions: res.reactions } : c)),
      }))
    } else {
      setIssue((cur) => ({ ...cur, reactions: res.reactions }))
    }
    setPickerTarget(null)
  }

  async function toggleWatch() {
    const res = await api(`/issues/${issue.id}/watch`, { method: 'POST' })
    setIssue((cur) => ({
      ...cur,
      watching: res.watching,
      watchers: res.watching
        ? [...cur.watchers, { user }]
        : cur.watchers.filter((w) => w.userId !== user.id),
    }))
    toast(res.watching ? 'Watching this issue' : 'Stopped watching')
  }

  async function setLabels(labelIds) {
    const updated = await api(`/issues/${issue.id}/labels`, { method: 'PUT', body: { labelIds } })
    setIssue((cur) => ({ ...cur, labels: updated.labels }))
    onChanged?.()
  }

  async function removeIssue() {
    if (!confirm(`Delete ${issueKey(issue)}? This cannot be undone.`)) return
    await api(`/issues/${issue.id}`, { method: 'DELETE' })
    toast('Issue deleted', { tone: 'error' })
    onChanged?.()
    onClose()
  }

  const grouped = useMemo(() => {
    if (!issue?.reactions) return []
    const map = {}
    issue.reactions.forEach((r) => {
      map[r.emoji] = map[r.emoji] || { emoji: r.emoji, count: 0, mine: false, users: [] }
      map[r.emoji].count += 1
      map[r.emoji].users.push(r.user)
      if (r.userId === user?.id) map[r.emoji].mine = true
    })
    return Object.values(map)
  }, [issue?.reactions, user?.id])

  const watching = issue?.watchers?.some((w) => w.userId === user?.id)
  const due = issue ? dueMeta(issue.dueDate, issue.status) : null

  return (
    <div className="fixed inset-0 z-[75] flex justify-end">
      <div className="drawer-scrim absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="drawer-in relative flex h-full w-full max-w-[720px] flex-col border-l border-line bg-white shadow-2xl">
        {loading || !issue ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : (
          <>

            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
                {activeProject?.key || issue.project?.key}-{issue.number}
              </span>
              <span className="h-3.5 w-px bg-line" />
              <button
                onClick={() => {
                  setPickerTarget('status')
                  setShowPicker(true)
                }}
                className="chip transition-transform hover:scale-105"
                style={{ background: `${statusMeta(issue.status).color}18`, color: statusMeta(issue.status).color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta(issue.status).color }} />
                {statusMeta(issue.status).label}
              </button>
              <div className="ml-auto flex items-center gap-1">
                <button onClick={toggleWatch} className={`app-btn app-btn-ghost h-8 gap-1.5 px-2.5 text-[12px] ${watching ? 'text-accent' : ''}`}>
                  {watching ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  {watching ? 'Watching' : 'Watch'}
                </button>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${window.location.origin}/app/issues`).catch(() => {})
                    toast(`${issueKey(issue)} link copied`, { tone: 'success' })
                  }}
                  className="app-btn app-btn-ghost h-8 w-8"
                  title="Copy link"
                >
                  <Link2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={removeIssue} className="app-btn app-btn-ghost h-8 w-8 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={onClose} className="app-btn app-btn-ghost h-8 w-8">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="thin-scroll flex-1 overflow-y-auto">

              <div className="px-5 pt-5">
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="w-full bg-transparent text-[22px] font-bold leading-snug tracking-tight outline-none"
                />

                <div className="mt-3">
                  {editingDesc ? (
                    <div className="a-fade">
                      <textarea
                        autoFocus
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        rows={5}
                        placeholder="Describe the work, acceptance criteria, links…"
                        className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-3 text-[14px] outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                      />
                      <div className="mt-2 flex gap-2">
                        <button onClick={saveDesc} className="app-btn app-btn-primary px-3.5 py-2 text-[13px]">
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingDesc(false)
                            setDescDraft(issue.description || '')
                          }}
                          className="app-btn app-btn-ghost px-3.5 py-2 text-[13px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingDesc(true)}
                      className={`h-lift w-full rounded-xl border border-transparent px-1 py-2 text-left text-[14.5px] leading-relaxed transition-colors hover:border-line hover:bg-bg ${
                        issue.description ? 'text-muted' : 'text-faint'
                      }`}
                    >
                      {issue.description || 'Add a description…'}
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {grouped.map((r) => (
                    <button
                      key={r.emoji}
                      onClick={() => react(r.emoji)}
                      className={`pop-in-scale flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition-all hover:-translate-y-0.5 ${
                        r.mine ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line bg-white text-muted'
                      }`}
                      title={r.users.map((u) => u.name).join(', ')}
                    >
                      <span className="text-[13px]">{r.emoji}</span> {r.count}
                    </button>
                  ))}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setPickerTarget('reaction')
                        setShowPicker((v) => (pickerTarget === 'reaction' ? !v : true))
                      }}
                      className="app-btn app-btn-ghost h-7 w-7 rounded-full"
                      title="Add reaction"
                    >
                      <SmilePlus className="h-3.5 w-3.5" />
                    </button>
                    {showPicker && pickerTarget === 'reaction' && (
                      <div className="dropdown-in absolute left-0 top-9 z-30 flex gap-1 rounded-xl border border-line bg-white p-2 shadow-xl">
                        {REACTIONS.map((e) => (
                          <button key={e} onClick={() => react(e)} className="h-8 w-8 rounded-lg text-[16px] transition-transform hover:scale-125">
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-x-6 gap-y-1 border-y border-line bg-bg/60 px-5 py-3.5 sm:grid-cols-2">
                <PropRow icon={UserCircle2} label="Assignee" value={issue.assignee?.name || 'Unassigned'} onOpen={() => { setPickerTarget('assignee'); setShowPicker(true) }}>
                  {issue.assignee ? <Avatar user={issue.assignee} size={20} /> : <span className="h-5 w-5 rounded-full border border-dashed border-line" />}
                </PropRow>
                <PropRow icon={Target} label="Priority" value={priorityMeta(issue.priority).label} onOpen={() => { setPickerTarget('priority'); setShowPicker(true) }}>
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: priorityMeta(issue.priority).color }} />
                </PropRow>
                <PropRow icon={Layers} label="Project" value={activeProject?.name || issue.project?.name} onOpen={() => { setPickerTarget('project'); setShowPicker(true) }}>
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: activeProject?.color || issue.project?.color }} />
                </PropRow>
                <PropRow icon={Timer} label="Cycle" value={cycles.find((c) => c.id === issue.cycleId)?.name || 'No cycle'} onOpen={() => { setPickerTarget('cycle'); setShowPicker(true) }}>
                  <Timer className="h-3.5 w-3.5 text-faint" />
                </PropRow>
                <PropRow icon={CalendarDays} label="Due date" value={due?.label || 'None'} onOpen={() => { setPickerTarget('due'); setShowPicker(true) }}>
                  <span className={`h-2 w-2 rounded-full ${due?.tone === 'overdue' ? 'bg-red-500' : due?.tone === 'today' ? 'bg-amber-500' : 'bg-line-strong'}`} />
                </PropRow>
                <PropRow icon={ActivityIcon} label="Estimate" value={issue.estimate ? `${issue.estimate} pts` : 'None'} onOpen={() => { setPickerTarget('estimate'); setShowPicker(true) }}>
                  <span className="text-[11px] text-faint">{issue.estimate || '—'}</span>
                </PropRow>
                <div className="col-span-full flex flex-wrap items-center gap-2 py-1.5">
                  <span className="flex items-center gap-1.5 text-[12.5px] text-faint">
                    <Tag className="h-3.5 w-3.5" /> Labels
                  </span>
                  {issue.labels.map((l) => (
                    <span key={l.labelId} className="chip" style={{ background: `${l.label.color}1a`, color: l.label.color }}>
                      {l.label.name}
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      setPickerTarget('labels')
                      setShowPicker(true)
                    }}
                    className="text-[12.5px] font-medium text-accent hover:underline"
                  >
                    + add label
                  </button>
                </div>
              </div>

              {showPicker && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowPicker(false)} />
                  <div className="a-fade sticky top-2 z-30 mx-5 mt-3 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
                    {pickerTarget === 'status' && (
                      <PickerList
                        items={STATUSES.map((s) => ({ id: s.id, label: s.label, color: s.color }))}
                        current={issue.status}
                        onPick={(v) => {
                          patch({ status: v })
                          setShowPicker(false)
                        }}
                      />
                    )}
                    {pickerTarget === 'priority' && (
                      <PickerList
                        items={PRIORITIES.map((p) => ({ id: p.id, label: `${p.label} (${p.short})`, color: p.color }))}
                        current={issue.priority}
                        onPick={(v) => {
                          patch({ priority: v })
                          setShowPicker(false)
                        }}
                      />
                    )}
                    {pickerTarget === 'assignee' && (
                      <PickerList
                        items={[{ id: '', label: 'Unassigned' }, ...members.map((m) => ({ id: m.user.id, label: m.user.name, avatar: m.user }))]}
                        current={issue.assigneeId || ''}
                        onPick={(v) => {
                          patch({ assigneeId: v || null })
                          setShowPicker(false)
                        }}
                      />
                    )}
                    {pickerTarget === 'project' && (
                      <PickerList
                        items={(team?.projects || []).map((p) => ({ id: p.id, label: `${p.name} (${p.key})`, color: p.color }))}
                        current={issue.projectId}
                        onPick={(v) => {
                          patch({ projectId: v })
                          setShowPicker(false)
                        }}
                      />
                    )}
                    {pickerTarget === 'cycle' && (
                      <PickerList
                        items={[{ id: '', label: 'No cycle' }, ...cycles.map((c) => ({ id: c.id, label: c.name }))]}
                        current={issue.cycleId || ''}
                        onPick={(v) => {
                          patch({ cycleId: v || null })
                          setShowPicker(false)
                        }}
                      />
                    )}
                    {pickerTarget === 'estimate' && (
                      <div className="flex flex-wrap gap-1.5 p-3">
                        {[0.5, 1, 2, 3, 5, 8, 13].map((n) => (
                          <button
                            key={n}
                            onClick={() => {
                              patch({ estimate: n })
                              setShowPicker(false)
                            }}
                            className="app-btn app-btn-ghost h-8 w-11 text-[13px]"
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            patch({ estimate: null })
                            setShowPicker(false)
                          }}
                          className="app-btn app-btn-ghost h-8 px-3 text-[13px]"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    {pickerTarget === 'due' && (
                      <div className="flex flex-wrap items-center gap-2 p-3">
                        <input
                          type="date"
                          defaultValue={issue.dueDate ? issue.dueDate.slice(0, 10) : ''}
                          onChange={(e) => patch({ dueDate: e.target.value || null })}
                          className="app-input px-3 py-2 text-[13px]"
                        />
                        {[
                          ['Today', 0],
                          ['Tomorrow', 1],
                          ['In a week', 7],
                          ['In two weeks', 14],
                        ].map(([label, days]) => (
                          <button
                            key={label}
                            onClick={() => {
                              const d = new Date()
                              d.setDate(d.getDate() + days)
                              patch({ dueDate: d.toISOString().slice(0, 10) })
                              setShowPicker(false)
                            }}
                            className="app-btn app-btn-ghost h-8 px-3 text-[12.5px]"
                          >
                            {label}
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            patch({ dueDate: null })
                            setShowPicker(false)
                          }}
                          className="app-btn app-btn-ghost h-8 px-3 text-[12.5px] text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    {pickerTarget === 'labels' && (
                      <div className="flex flex-wrap gap-2 p-3">
                        {projectLabels.map((l) => {
                          const on = issue.labels.some((x) => x.labelId === l.id)
                          return (
                            <button
                              key={l.id}
                              onClick={() => setLabels(on ? issue.labels.filter((x) => x.labelId !== l.id).map((x) => x.labelId) : [...issue.labels.map((x) => x.labelId), l.id])}
                              className={`chip transition-transform hover:scale-105 ${on ? 'ring-2 ring-offset-1' : 'opacity-70'}`}
                              style={{ background: `${l.color}1a`, color: l.color }}
                            >
                              {on ? <Check className="h-3 w-3" /> : null} {l.name}
                            </button>
                          )
                        })}
                        {projectLabels.length === 0 && <span className="text-[13px] text-faint">No labels in this workspace yet.</span>}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="px-5 py-5">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
                  <MessageSquare className="h-4 w-4 text-accent" /> Activity & comments
                  <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] text-muted">{issue.comments.length}</span>
                </div>

                <form onSubmit={submitComment} className="mb-5 flex items-start gap-3">
                  <Avatar user={user} size={30} />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(e)
                      }}
                      rows={2}
                      placeholder="Leave a comment — ⌘/Ctrl + Enter to send"
                      className="w-full resize-none rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[14px] outline-none transition-all focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button type="submit" disabled={busy || !comment.trim()} className="app-btn app-btn-primary h-8 px-3.5 text-[13px] disabled:opacity-50">
                        <Send className="h-3.5 w-3.5" /> Comment
                      </button>
                      <span className="text-[11.5px] text-faint">
                        Watchers: {(issue.watchers || []).map((w) => w.user.name.split(' ')[0]).join(', ') || 'nobody'}
                      </span>
                    </div>
                  </div>
                </form>

                <div className="flex flex-col gap-4">
                  {issue.comments.map((c, idx) => {
                    const groupedReactions = {}
                    ;(c.reactions || []).forEach((r) => {
                      groupedReactions[r.emoji] = groupedReactions[r.emoji] || { emoji: r.emoji, count: 0, mine: false }
                      groupedReactions[r.emoji].count += 1
                      if (r.userId === user?.id) groupedReactions[r.emoji].mine = true
                    })
                    return (
                      <div key={c.id} className="a-up flex gap-3" style={{ animationDelay: `${Math.min(idx, 8) * 45}ms` }}>
                        <Avatar user={c.author} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className="font-medium">{c.author.name}</span>
                            <span className="text-[11.5px] text-faint">{relativeTime(c.createdAt)}</span>
                          </div>
                          {editingComment === c.id ? (
                            <div className="mt-1.5">
                              <textarea
                                autoFocus
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                rows={2}
                                className="w-full resize-none rounded-xl border border-line bg-bg px-3 py-2 text-[13.5px] outline-none focus:border-accent"
                              />
                              <div className="mt-1.5 flex gap-2">
                                <button onClick={() => saveCommentEdit(c.id)} className="app-btn app-btn-primary h-7 px-3 text-[12.5px]">
                                  Save
                                </button>
                                <button onClick={() => setEditingComment(null)} className="app-btn app-btn-ghost h-7 px-3 text-[12.5px]">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-muted">{c.body}</p>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            {Object.values(groupedReactions).map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => react(r.emoji, c.id)}
                                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] transition-all hover:-translate-y-0.5 ${
                                  r.mine ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line text-muted'
                                }`}
                              >
                                <span className="text-[12.5px]">{r.emoji}</span> {r.count}
                              </button>
                            ))}
                            <div className="relative">
                              <button
                                onClick={() => {
                                  setPickerTarget(`c-${c.id}`)
                                  setShowPicker(true)
                                }}
                                className="rounded-full p-1 text-faint transition-colors hover:bg-raised hover:text-fg"
                                title="React"
                              >
                                <SmilePlus className="h-3.5 w-3.5" />
                              </button>
                              {showPicker && pickerTarget === `c-${c.id}` && (
                                <div className="dropdown-in absolute left-0 top-8 z-30 flex gap-1 rounded-xl border border-line bg-white p-2 shadow-xl">
                                  {REACTIONS.map((e) => (
                                    <button key={e} onClick={() => react(e, c.id)} className="h-7 w-7 rounded-lg text-[15px] transition-transform hover:scale-125">
                                      {e}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {c.author.id === user?.id && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingComment(c.id)
                                    setCommentDraft(c.body)
                                  }}
                                  className="text-faint transition-colors hover:text-fg"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => deleteComment(c.id)} className="text-faint transition-colors hover:text-red-500" title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {issue.comments.length === 0 && <p className="text-[13.5px] text-faint">No comments yet — be the first.</p>}
                </div>

                <div className="mt-8">
                  <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide text-faint">
                    <ActivityIcon className="h-3.5 w-3.5" /> History
                  </div>
                  <div className="relative pl-5">
                    <span className="absolute left-[7px] top-1 bottom-1 w-px bg-line" />
                    {issue.activity?.map((a, idx) => (
                      <div key={a.id} className="a-up relative mb-3.5 flex items-start gap-2.5" style={{ animationDelay: `${Math.min(idx, 10) * 35}ms` }}>
                        <span className="absolute -left-5 mt-1.5 h-2 w-2 rounded-full bg-line-strong ring-4 ring-white" />
                        <Avatar user={a.actor} size={22} />
                        <p className="text-[13px] leading-relaxed text-muted">
                          <span className="font-medium text-fg">{a.actor.name}</span>{' '}
                          {(ACTION_TEXT[a.action] || (() => a.action))(
                            a.actor,
                            prettify(a.fromValue),
                            prettify(a.toValue),
                          )}
                          <span className="ml-1.5 text-[11.5px] text-faint">{relativeTime(a.createdAt)}</span>
                        </p>
                      </div>
                    ))}
                    {(!issue.activity || issue.activity.length === 0) && <p className="text-[13px] text-faint">No history yet.</p>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

function prettify(value) {
  if (!value) return ''
  return String(value).replace(/_/g, ' ').toLowerCase()
}

function PropRow({ icon: Icon, label, value, onOpen, children }) {
  return (
    <button onClick={onOpen} className="group flex items-center gap-3 rounded-lg px-1.5 py-2 text-left transition-colors hover:bg-white">
      <span className="flex w-[92px] shrink-0 items-center gap-1.5 text-[12.5px] text-faint">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px]">
        {children}
        <span className="truncate">{value}</span>
      </span>
      <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-transparent transition-colors group-hover:text-faint" />
    </button>
  )
}

function PickerList({ items, current, onPick }) {
  return (
    <div className="thin-scroll max-h-[260px] overflow-y-auto p-1.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onPick(item.id)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors hover:bg-raised"
        >
          {item.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />}
          {item.avatar && <Avatar user={item.avatar} size={20} />}
          <span className="flex-1 truncate">{item.label}</span>
          {item.id === current && <Check className="h-3.5 w-3.5 text-accent" />}
        </button>
      ))}
    </div>
  )
}
