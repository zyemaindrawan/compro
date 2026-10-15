import type { H3Event } from 'h3'
import { settingsModel } from '../models/settings.model'

const startedAt = Date.now()

const databaseReachable = defineCachedFunction(() => settingsModel.ping(useAnonDb()).catch(() => false), {
  name: 'health-db',
  getKey: () => 'ping',
  maxAge: 30,
})

const FORWARDING_HEADERS = ['x-forwarded-for', 'x-real-ip', 'forwarded', 'cf-connecting-ip', 'true-client-ip', 'x-forwarded-proto', 'x-forwarded-host'] as const

async function requestInfo(event: H3Event) {
  await requireAdmin(event)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return {
    socketAddress: event.node.req.socket?.remoteAddress ?? null,
    headers: Object.fromEntries(FORWARDING_HEADERS.map(name => [name, getRequestHeader(event, name) ?? null])),
    trustProxy: useRuntimeConfig().trustProxy || 'none',
    resolvedIp: clientIp(event) || null,
  }
}

async function health(event: H3Event) {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const database = await databaseReachable()
  if (!database) setResponseStatus(event, 503)
  return {
    status: database ? 'ok' : 'degraded',
    database,
    buildId: useRuntimeConfig().app.buildId,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  }
}

export const systemController = {
  requestInfo,
  health,
}
