import { describe, expect, it } from 'vitest'
import { checkFormToken, hashIp, isLikelyBot, issueFormToken, MIN_FILL_MS } from '../../server/services/spam.service'

const secret = 'test-secret'
const issuedAt = 1_790_000_000_000

describe('form token', () => {
  it('accepts a token older than the minimum fill time', () => {
    const token = issueFormToken(secret, issuedAt)
    expect(checkFormToken(secret, token, issuedAt + MIN_FILL_MS + 1)).toBe('ok')
  })

  it('flags submissions faster than the minimum fill time', () => {
    const token = issueFormToken(secret, issuedAt)
    expect(checkFormToken(secret, token, issuedAt + 500)).toBe('too_fast')
  })

  it('rejects forged, expired and malformed tokens', () => {
    const token = issueFormToken(secret, issuedAt)
    expect(checkFormToken('other-secret', token, issuedAt + 10_000)).toBe('invalid')
    expect(checkFormToken(secret, `${issuedAt - 60_000}.${token.split('.')[1]}`, issuedAt + 10_000)).toBe('invalid')
    expect(checkFormToken(secret, token, issuedAt + 25 * 60 * 60 * 1000)).toBe('invalid')
    expect(checkFormToken(secret, 'garbage', issuedAt)).toBe('invalid')
    expect(checkFormToken(secret, '', issuedAt)).toBe('missing')
  })
})

describe('isLikelyBot', () => {
  it('treats a filled honeypot or a bad token as a bot, a missing token as unknown', () => {
    expect(isLikelyBot({ honeypot: 'https://spam.example', token: 'ok' })).toBe(true)
    expect(isLikelyBot({ honeypot: '', token: 'too_fast' })).toBe(true)
    expect(isLikelyBot({ honeypot: '', token: 'invalid' })).toBe(true)
    expect(isLikelyBot({ honeypot: '', token: 'missing' })).toBe(false)
    expect(isLikelyBot({ honeypot: '  ', token: 'ok' })).toBe(false)
  })
})

describe('hashIp', () => {
  it('is stable for the same secret and never returns the raw address', () => {
    expect(hashIp(secret, '203.0.113.7')).toBe(hashIp(secret, '203.0.113.7'))
    expect(hashIp(secret, '203.0.113.7')).not.toContain('203.0.113.7')
    expect(hashIp('other', '203.0.113.7')).not.toBe(hashIp(secret, '203.0.113.7'))
  })
})
