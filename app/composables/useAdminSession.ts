import type { AdminProfile, AuthNextStep } from '#shared/types/models'

interface AdminSessionState {
  loaded: boolean
  authenticated: boolean
  isAdmin: boolean
  next: AuthNextStep | null
  profile: AdminProfile | null
}

const signedOut = (): AdminSessionState => ({
  loaded: true,
  authenticated: false,
  isAdmin: false,
  next: null,
  profile: null,
})

export function useAdminSession() {
  const state = useState<AdminSessionState>('admin-session', () => ({ ...signedOut(), loaded: false }))

  async function refresh() {
    const session = await $fetch('/api/auth/session').catch(() => null)
    state.value = session
      ? { loaded: true, authenticated: session.authenticated, isAdmin: session.isAdmin, next: session.next, profile: 'profile' in session ? session.profile ?? null : null }
      : signedOut()
  }

  async function ensure() {
    if (!state.value.loaded) await refresh()
  }

  function reset() {
    state.value = signedOut()
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
    reset()
    await navigateTo('/admin/login')
  }

  return { state, refresh, ensure, reset, logout }
}
