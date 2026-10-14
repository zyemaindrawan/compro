import type { Db } from '../utils/supabase'
import { createClient } from '@supabase/supabase-js'
import type { MfaFactor } from '#shared/types/models'

export interface AuthClaims {
  sub: string
  email?: string
  aal?: string
}

async function getClaims(db: Db): Promise<AuthClaims | null> {
  const { data, error } = await db.auth.getClaims()
  if (error || !data?.claims) return null
  return data.claims as AuthClaims
}

async function signIn(db: Db, email: string, password: string) {
  const { data, error } = await db.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    if (error?.status === 429) fail(429, 'Too many attempts. Try again in a minute.')
    fail(401, 'Incorrect email or password.')
  }
  return data.user
}

async function verifyPassword(email: string, password: string) {
  const { url, key } = supabaseConfig()
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) return false
  await client.auth.signOut({ scope: 'local' })
  return true
}

async function signOut(db: Db, scope: 'local' | 'others' = 'local') {
  const { error } = await db.auth.signOut({ scope })
  if (error && error.status !== 401) throwDbError(error)
}

async function assuranceLevel(db: Db) {
  const { data, error } = await db.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) fail(401, 'Please sign in.')
  return data.currentLevel
}

async function listFactors(db: Db): Promise<MfaFactor[]> {
  const { data, error } = await db.auth.mfa.listFactors()
  if (error) throwDbError(error)
  return data.all
    .filter(factor => factor.factor_type === 'totp')
    .map(factor => ({
      id: factor.id,
      friendlyName: factor.friendly_name ?? 'Authenticator',
      status: factor.status,
      createdAt: factor.created_at,
    }))
}

async function enrollTotp(db: Db, friendlyName: string, issuer: string) {
  const { data, error } = await db.auth.mfa.enroll({ factorType: 'totp', friendlyName, issuer })
  if (error) throwDbError(error)
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
}

async function verifyTotp(db: Db, factorId: string, code: string) {
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) {
    if (error.status === 429) fail(429, 'Too many attempts. Try again in a minute.')
    fail(400, 'That code is not valid. Check your authenticator app and try again.')
  }
}

async function unenroll(db: Db, factorId: string) {
  const { error } = await db.auth.mfa.unenroll({ factorId })
  if (error) throwDbError(error)
}

async function updatePassword(db: Db, password: string) {
  const { error } = await db.auth.updateUser({ password })
  if (error) {
    if (error.code === 'same_password') fail(422, 'Choose a password you have not used here before.', { fields: { password: 'Use a new password' } })
    if (error.code === 'weak_password') fail(422, 'This password is too weak.', { fields: { password: 'Choose a stronger password' } })
    throwDbError(error)
  }
}

export const authModel = {
  getClaims,
  signIn,
  verifyPassword,
  signOut,
  assuranceLevel,
  listFactors,
  enrollTotp,
  verifyTotp,
  unenroll,
  updatePassword,
}
