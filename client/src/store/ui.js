import { create } from 'zustand'

let toastId = 0

export const useUI = create((set, get) => ({
  commandOpen: false,
  sidebarOpen: false,
  sidebarCollapsed: localStorage.getItem('fb_sidebar') === 'collapsed',
  activeProjectId: localStorage.getItem('fb_project') || null,
  drawerIssueId: null,
  toasts: [],
  palette: null,

  toggleCommand(force) {
    set({ commandOpen: force === undefined ? !get().commandOpen : force })
  },

  toggleSidebar(force) {
    set({ sidebarOpen: force === undefined ? !get().sidebarOpen : force })
  },

  toggleCollapse() {
    const next = !get().sidebarCollapsed
    localStorage.setItem('fb_sidebar', next ? 'collapsed' : 'expanded')
    set({ sidebarCollapsed: next })
  },

  setActiveProject(projectId) {
    if (projectId) localStorage.setItem('fb_project', projectId)
    set({ activeProjectId: projectId })
  },

  openIssue(issueId) {
    set({ drawerIssueId: issueId })
  },

  closeIssue() {
    set({ drawerIssueId: null })
  },

  toast(message, opts = {}) {
    const id = ++toastId
    const tone = opts.tone || 'default'
    set({ toasts: [...get().toasts, { id, message, tone, action: opts.action, icon: opts.icon }] })
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) })
    }, opts.duration || 3200)
    return id
  },

  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
}))
