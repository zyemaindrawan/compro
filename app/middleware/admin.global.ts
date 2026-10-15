const AUTH_PAGES = new Set(['/admin/login', '/admin/mfa'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return

  const session = useAdminSession()
  await session.ensure()
  const { authenticated, isAdmin, next } = session.state.value

  if (!authenticated || !isAdmin) {
    if (to.path === '/admin/login') return
    const redirect = to.path === '/admin' ? undefined : to.fullPath
    return navigateTo({ path: '/admin/login', query: redirect ? { redirect } : undefined })
  }

  if (next !== 'done') {
    return to.path === '/admin/mfa' ? undefined : navigateTo('/admin/mfa')
  }

  if (AUTH_PAGES.has(to.path)) return navigateTo('/admin')
})
