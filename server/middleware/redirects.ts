const SKIPPED = /^\/(api|_nuxt|__|admin)(\/|$)|\.[a-z0-9]+$/i

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const path = event.path.split('?')[0]?.replace(/\/+$/, '') || '/'
  if (SKIPPED.test(path)) return

  const rule = (await getRedirects())[path]
  if (rule) return sendRedirect(event, rule.to, rule.status)
})
