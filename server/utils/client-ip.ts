import { isIP } from 'node:net'
import type { H3Event } from 'h3'

export const CLIENT_IP_HEADER = 'x-compro-client-ip'

declare module 'h3' {
  interface H3EventContext {
    clientIp?: string
  }
}

function normalizeIp(value: string | undefined | null) {
  const candidate = (value ?? '').trim().replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '')
  return isIP(candidate) ? candidate : ''
}

function headerValue(event: H3Event, name: string) {
  const raw = event.node.req.headers[name.toLowerCase()]
  return Array.isArray(raw) ? raw.join(',') : raw ?? ''
}

export function resolveClientIp(event: H3Event, policy: string) {
  const socketIp = normalizeIp(event.node.req.socket?.remoteAddress)
  const rule = policy.trim().toLowerCase()
  if (!rule || rule === 'none') return socketIp

  const hops = /^xff:(\d+)$/.exec(rule)
  if (hops) {
    const entries = headerValue(event, 'x-forwarded-for').split(',').map(entry => entry.trim()).filter(Boolean)
    const index = entries.length - Number(hops[1])
    return normalizeIp(index >= 0 ? entries[index] : '') || socketIp
  }

  return normalizeIp(headerValue(event, rule).split(',')[0]) || socketIp
}

export function clientIp(event: H3Event) {
  return event.context.clientIp ?? ''
}
