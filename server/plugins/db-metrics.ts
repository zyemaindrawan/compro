import type { H3Event } from 'h3'
import { cacheService } from '../services/cache.service'

interface ParentContext {
  dbQueries?: DbQueryLog
}

function parentContext(event: H3Event): ParentContext | undefined {
  return (event.node.req as { __unenv__?: ParentContext }).__unenv__
}

export default defineNitroPlugin((nitroApp) => {
  if (!dbQueryLogEnabled()) return
  console.warn('[db-metrics] NUXT_DB_QUERY_LOG is on. Use it only in tests: it exposes query counts and lets requests purge the public cache.')

  nitroApp.hooks.hook('request', async (event) => {
    const parent = parentContext(event)?.dbQueries
    event.context.dbQueries = parent ?? { count: 0, log: [] }
    if (!parent && getRequestHeader(event, 'x-db-cold') === '1') await cacheService.purgePublic()
  })

  nitroApp.hooks.hook('beforeResponse', (event) => {
    const metrics = event.context.dbQueries
    if (!metrics || parentContext(event)?.dbQueries || event.node.res.headersSent) return
    setResponseHeader(event, 'x-db-queries', String(metrics.count))
    setResponseHeader(event, 'x-db-query-log', metrics.log.join('; ').slice(0, 2000))
    setResponseHeader(event, 'server-timing', `db;desc="${metrics.count} queries"`)
  })
})
