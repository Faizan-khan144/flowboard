import { api } from './api'

export async function teamInviteUrl(team) {
  if (!team?.id) return null
  let code = team.inviteCode
  if (!code) {
    try {
      const invite = await api(`/teams/${team.id}/invites`, { method: 'POST', body: { role: 'MEMBER' } })
      code = invite.token
    } catch {
      return null
    }
  }
  return `${window.location.origin}/join/${code}`
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}

export function copyLink(url) {
  return copyText(url)
}
