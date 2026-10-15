import { describe, expect, it } from 'vitest'
import type { H3Event } from 'h3'
import { resolveClientIp } from '../../server/utils/client-ip'

function event(headers: Record<string, string>, remoteAddress = '10.0.0.5') {
  return { node: { req: { headers, socket: { remoteAddress } } } } as unknown as H3Event
}

describe('resolveClientIp', () => {
  it('ignores forwarding headers unless a proxy is trusted', () => {
    expect(resolveClientIp(event({ 'x-forwarded-for': '1.1.1.1' }), '')).toBe('10.0.0.5')
    expect(resolveClientIp(event({ 'x-real-ip': '1.1.1.1' }), 'none')).toBe('10.0.0.5')
  })

  it('reads X-Forwarded-For from the right so a spoofed left entry is ignored', () => {
    const forwarded = event({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' })
    expect(resolveClientIp(forwarded, 'xff:1')).toBe('203.0.113.9')
    expect(resolveClientIp(forwarded, 'xff:2')).toBe('6.6.6.6')
    expect(resolveClientIp(forwarded, 'xff:3')).toBe('10.0.0.5')
  })

  it('uses a single trusted header and falls back to the socket on invalid values', () => {
    expect(resolveClientIp(event({ 'x-real-ip': '198.51.100.4' }), 'x-real-ip')).toBe('198.51.100.4')
    expect(resolveClientIp(event({ 'x-real-ip': 'not-an-ip' }), 'x-real-ip')).toBe('10.0.0.5')
    expect(resolveClientIp(event({}), 'cf-connecting-ip')).toBe('10.0.0.5')
  })

  it('unwraps IPv4-mapped IPv6 socket addresses', () => {
    expect(resolveClientIp(event({}, '::ffff:192.0.2.1'), '')).toBe('192.0.2.1')
    expect(resolveClientIp(event({}, '2001:db8::1'), '')).toBe('2001:db8::1')
  })
})
