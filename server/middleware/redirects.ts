import { REDIRECT_RESERVED_PATH, REDIRECT_SKIPPED_FILE } from '#shared/constants'

// Carries the query string over (preview ids, campaign tags); a target with its own query keeps it first.
function withQuery(target: string, query: string) {
  if (!query) return target
  return target.includes('?') ? `${target}&${query}` : `${target}?${query}`
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const queryStart = event.path.indexOf('?')
  const rawPath = queryStart === -1 ? event.path : event.path.slice(0, queryStart)
  const query = queryStart === -1 ? '' : event.path.slice(queryStart + 1)
  const path = rawPath.replace(/\/+$/, '') || '/'
  if (REDIRECT_RESERVED_PATH.test(path) || REDIRECT_SKIPPED_FILE.test(path)) return

  const rule = (await getRedirects())[path]
  if (rule) return sendRedirect(event, withQuery(rule.to, query), rule.status)
})
