import type { H3Event } from 'h3'
import { loginSchema, mfaCodeSchema } from '#shared/schemas/auth.schema'
import type { AuthNextStep, MfaFactor } from '#shared/types/models'
import { authModel } from '../models/auth.model'
import { adminModel } from '../models/admin.model'
import { settingsModel } from '../models/settings.model'
import type { Db } from '../utils/supabase'

function hasVerifiedFactor(factors: MfaFactor[]) {
  return factors.some(factor => factor.status === 'verified')
}

async function nextStep(db: Db): Promise<AuthNextStep> {
  if (await authModel.assuranceLevel(db) === 'aal2') return 'done'
  return hasVerifiedFactor(await authModel.listFactors(db)) ? 'verify' : 'enroll'
}

async function requireAdminSession(db: Db) {
  const claims = await authModel.getClaims(db)
  if (!claims) fail(401, 'Please sign in.')
  const profile = await adminModel.findProfile(db, claims.sub)
  if (!profile) fail(403, 'This account does not have admin access.')
  return claims
}

async function login(event: H3Event) {
  const input = await validateBody(event, loginSchema)
  const db = useDb(event)
  const user = await authModel.signIn(db, input.email, input.password)

  const profile = await adminModel.findProfile(db, user.id)
  if (!profile) {
    await authModel.signOut(db)
    fail(403, 'This account does not have admin access.')
  }

  return { next: await nextStep(db) }
}

async function logout(event: H3Event) {
  const db = useDb(event)
  await authModel.signOut(db)
  return { ok: true }
}

async function session(event: H3Event) {
  const db = useDb(event)
  const claims = await authModel.getClaims(db)
  if (!claims) return { authenticated: false, isAdmin: false, next: null }

  const profile = await adminModel.findProfile(db, claims.sub, claims.email)
  if (!profile) return { authenticated: true, isAdmin: false, next: null }

  return {
    authenticated: true,
    isAdmin: true,
    next: await nextStep(db),
    profile: claims.aal === 'aal2' ? profile : null,
  }
}

async function enroll(event: H3Event) {
  const db = useDb(event)
  await requireAdminSession(db)

  const factors = await authModel.listFactors(db)
  if (hasVerifiedFactor(factors)) {
    fail(409, 'Two-factor authentication is already set up. Enter the code from your authenticator app.')
  }

  await Promise.all(factors.map(factor => authModel.unenroll(db, factor.id)))
  const siteName = await settingsModel.getSiteName(db)
  return authModel.enrollTotp(db, `Authenticator ${Date.now()}`, siteName)
}

async function verify(event: H3Event) {
  const input = await validateBody(event, mfaCodeSchema)
  const db = useDb(event)
  await requireAdminSession(db)

  const factors = await authModel.listFactors(db)
  const factor = input.factorId
    ? factors.find(item => item.id === input.factorId)
    : factors.find(item => item.status === 'verified')
  if (!factor) fail(400, 'No authenticator is set up for this account yet.')

  await authModel.verifyTotp(db, factor.id, input.code)
  return { next: 'done' satisfies AuthNextStep }
}

export const authController = {
  login,
  logout,
  session,
  enroll,
  verify,
}
