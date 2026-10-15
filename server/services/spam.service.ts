import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const MIN_FILL_MS = 3000
const MAX_TOKEN_AGE_MS = 24 * 60 * 60 * 1000

export type TokenCheck = 'missing' | 'invalid' | 'too_fast' | 'ok'

function sign(secret: string, issuedAt: number) {
  return createHmac('sha256', secret).update(`form:${issuedAt}`).digest('base64url')
}

export function issueFormToken(secret: string, now = Date.now()) {
  return `${now}.${sign(secret, now)}`
}

export function checkFormToken(secret: string, token: string, now = Date.now()): TokenCheck {
  if (!token) return 'missing'
  const [rawTime, signature] = token.split('.')
  const issuedAt = Number(rawTime)
  if (!Number.isSafeInteger(issuedAt) || !signature) return 'invalid'

  const expected = Buffer.from(sign(secret, issuedAt))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return 'invalid'

  const age = now - issuedAt
  if (age < 0 || age > MAX_TOKEN_AGE_MS) return 'invalid'
  if (age < MIN_FILL_MS) return 'too_fast'
  return 'ok'
}

export function isLikelyBot(input: { honeypot: string, token: TokenCheck }) {
  return input.honeypot.trim() !== '' || input.token === 'invalid' || input.token === 'too_fast'
}

export function hashIp(secret: string, ip: string) {
  return createHash('sha256').update(`${secret}:${ip}`).digest('hex')
}

function secret() {
  const salt = useRuntimeConfig().ipHashSalt
  if (salt) return salt
  if (import.meta.dev) return 'local-dev-salt'
  console.error('[spam] NUXT_IP_HASH_SALT is not set')
  fail(503, 'This form is temporarily unavailable. Please email us instead.')
}

export const spamService = {
  issueToken: () => issueFormToken(secret()),
  checkToken: (token: string) => checkFormToken(secret(), token),
  hashIp: (ip: string) => hashIp(secret(), ip),
  isLikelyBot,
}
