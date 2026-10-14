import type { H3Event } from 'h3'
import { authModel } from '../models/auth.model'
import { adminModel } from '../models/admin.model'

export interface AdminContext {
  userId: string
  email: string
}

declare module 'h3' {
  interface H3EventContext {
    admin?: AdminContext
  }
}

export async function requireAdmin(event: H3Event): Promise<AdminContext> {
  if (event.context.admin) return event.context.admin

  const db = useDb(event)
  const claims = await authModel.getClaims(db)
  if (!claims) fail(401, 'Please sign in.')
  if (claims.aal !== 'aal2') fail(403, 'Two-factor verification required.', { code: 'mfa_required' })

  const profile = await adminModel.findProfile(db, claims.sub)
  if (!profile) fail(403, 'This account does not have admin access.', { code: 'not_admin' })

  event.context.admin = { userId: claims.sub, email: claims.email ?? '' }
  return event.context.admin
}
