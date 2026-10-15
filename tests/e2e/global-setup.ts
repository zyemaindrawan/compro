import { mkdirSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_FILE } from './fixtures/admin'

export default async function globalSetup() {
  const url = process.env.NUXT_SUPABASE_URL
  const secretKey = process.env.NUXT_SUPABASE_SECRET_KEY
  if (!url || !secretKey) throw new Error('E2E needs NUXT_SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY in .env (local Supabase).')

  const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listError) throw listError
  const existing = list.users.find(user => user.email === E2E_ADMIN_EMAIL)
  if (existing) await supabase.auth.admin.deleteUser(existing.id)

  const password = `${randomBytes(18).toString('base64url')}A1a`
  const { data, error } = await supabase.auth.admin.createUser({ email: E2E_ADMIN_EMAIL, password, email_confirm: true })
  if (error) throw error
  const { error: profileError } = await supabase.from('admin_profiles').insert({ user_id: data.user.id, display_name: 'E2E Admin' })
  if (profileError) throw profileError

  mkdirSync('tests/e2e/.auth', { recursive: true })
  writeFileSync(E2E_ADMIN_FILE, JSON.stringify({ email: E2E_ADMIN_EMAIL, password, totpSecret: '' }))
}
