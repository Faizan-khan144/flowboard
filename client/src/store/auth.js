import { create } from 'zustand'
import { api, setToken } from '../lib/api'

export const useAuth = create((set, get) => ({
  user: null,
  teams: [],
  isGuest: !localStorage.getItem('fb_token'),
  isNew: false,
  teamId: localStorage.getItem('fb_team') || null,
  loading: true,

  async bootstrap() {
    try {
      if (!localStorage.getItem('fb_token')) {
        const session = await api('/demo/session', { method: 'POST' })
        setToken(session.token)
        set({ user: session.user, teams: session.teams, teamId: session.teamId, isGuest: true })
        localStorage.setItem('fb_team', session.teamId)
        set({ loading: false })
        return
      }
      const { user, teams } = await api('/auth/me')
      set({ user, teams, isGuest: false, loading: false })
      if (!get().teamId && teams.length) get().selectTeam(teams[0].id)
    } catch {
      setToken(null)
      localStorage.removeItem('fb_team')
      set({ user: null, teams: [], teamId: null, loading: false })
      try {
        const session = await api('/demo/session', { method: 'POST' })
        setToken(session.token)
        set({ user: session.user, teams: session.teams, teamId: session.teamId, isGuest: true })
      } catch {

      }
    }
  },

  async login(email, password) {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.token)
    set({ user: data.user, isGuest: false })
    const me = await api('/auth/me')
    set({ teams: me.teams })
    if (me.teams.length) get().selectTeam(me.teams[0].id)
    return data.user
  },

  async signup(name, email, password, inviteCode) {
    const data = await api('/auth/signup', { method: 'POST', body: { name, email, password, inviteCode } })
    setToken(data.token)
    set({ user: data.user, isGuest: false, isNew: Boolean(data.isNew) })
    const me = await api('/auth/me')
    set({ teams: me.teams })
    if (data.teamId) get().selectTeam(data.teamId)
    else if (me.teams.length) get().selectTeam(me.teams[0].id)
    return data.user
  },

  async refreshTeams() {
    try {
      const { teams } = await api('/auth/me')
      set({ teams })
      if (!teams.some((t) => t.id === get().teamId) && teams.length) get().selectTeam(teams[0].id)
      return teams
    } catch {
      return get().teams
    }
  },

  updateUser(patch) {
    set({ user: { ...get().user, ...patch } })
  },

  clearIsNew() {
    set({ isNew: false })
  },

  logout() {
    setToken(null)
    localStorage.removeItem('fb_team')
    set({ user: null, teams: [], teamId: null, isGuest: true, loading: false })
    get().bootstrap()
  },

  selectTeam(teamId) {
    set({ teamId })
    localStorage.setItem('fb_team', teamId)
  },
}))
