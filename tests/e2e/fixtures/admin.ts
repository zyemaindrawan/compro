import { readFileSync, writeFileSync } from 'node:fs'
import { TOTP } from 'otpauth'

export const E2E_ADMIN_EMAIL = 'e2e-admin@example.test'
export const E2E_ADMIN_FILE = 'tests/e2e/.auth/admin.json'
export const ADMIN_STATE = 'tests/e2e/.auth/state.json'

export interface AdminCredentials {
  email: string
  password: string
  totpSecret: string
}

export function readAdmin(): AdminCredentials {
  return JSON.parse(readFileSync(E2E_ADMIN_FILE, 'utf8')) as AdminCredentials
}

export function saveTotpSecret(secret: string) {
  writeFileSync(E2E_ADMIN_FILE, JSON.stringify({ ...readAdmin(), totpSecret: secret }))
}

export function totpCode(secret: string) {
  return new TOTP({ secret }).generate()
}
