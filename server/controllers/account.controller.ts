import type { H3Event } from 'h3'
import { mfaCodeSchema, passwordChangeSchema, profileSchema } from '#shared/schemas/auth.schema'
import { adminModel } from '../models/admin.model'
import { authModel } from '../models/auth.model'
import { settingsModel } from '../models/settings.model'

async function profile(event: H3Event) {
  const admin = await requireAdmin(event)
  const db = await useDb(event)
  const [found, factors] = await Promise.all([
    adminModel.findProfile(db, admin.userId, admin.email),
    authModel.listFactors(db),
  ])
  return { profile: found, factors: factors.filter(factor => factor.status === 'verified') }
}

async function updateProfile(event: H3Event) {
  const admin = await requireAdmin(event)
  const input = await validateBody(event, profileSchema)
  const db = await useDb(event)
  await adminModel.updateProfile(db, admin.userId, input)
  return adminModel.findProfile(db, admin.userId, admin.email)
}

async function changePassword(event: H3Event) {
  const admin = await requireAdmin(event)
  const input = await validateBody(event, passwordChangeSchema)

  const valid = await authModel.verifyPassword(admin.email, input.currentPassword)
  if (!valid) fail(422, 'Your current password is incorrect.', { fields: { currentPassword: 'Incorrect password' } })

  const db = await useDb(event)
  await authModel.updatePassword(db, input.password)
  await authModel.signOut(db, 'others')
  return { ok: true }
}

async function startFactorReplacement(event: H3Event) {
  await requireAdmin(event)
  const db = await useDb(event)
  const factors = await authModel.listFactors(db)
  const stale = factors.filter(factor => factor.status === 'unverified')
  await Promise.all(stale.map(factor => authModel.unenroll(db, factor.id)))

  const siteName = await settingsModel.getSiteName(db)
  return authModel.enrollTotp(db, `Authenticator ${Date.now()}`, siteName)
}

async function confirmFactorReplacement(event: H3Event) {
  await requireAdmin(event)
  const input = await validateBody(event, mfaCodeSchema)
  if (!input.factorId) fail(422, 'Missing authenticator id.')

  const db = await useDb(event)
  const factors = await authModel.listFactors(db)
  const pending = factors.find(factor => factor.id === input.factorId && factor.status === 'unverified')
  if (!pending) fail(404, 'This setup has expired. Start again.')

  await authModel.verifyTotp(db, pending.id, input.code)
  const previous = factors.filter(factor => factor.id !== pending.id)
  await Promise.all(previous.map(factor => authModel.unenroll(db, factor.id)))
  return { ok: true }
}

async function signOutOthers(event: H3Event) {
  await requireAdmin(event)
  await authModel.signOut(await useDb(event), 'others')
  return { ok: true }
}

export const accountController = {
  profile,
  updateProfile,
  changePassword,
  startFactorReplacement,
  confirmFactorReplacement,
  signOutOthers,
}
