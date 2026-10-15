import type { H3Event } from 'h3'

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

export const systemController = {
  requestInfo,
}
