import { REDIRECT_RESERVED_PATH, REDIRECT_SKIPPED_FILE } from '#shared/constants'

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const path = event.path.split('?')[0]?.replace(/\/+$/, '') || '/'
  if (REDIRECT_RESERVED_PATH.test(path) || REDIRECT_SKIPPED_FILE.test(path)) return

  const rule = (await getRedirects())[path]
  if (rule) return sendRedirect(event, rule.to, rule.status)
})
