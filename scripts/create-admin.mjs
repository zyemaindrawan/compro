import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const [email, ...nameParts] = process.argv.slice(2)
const displayName = nameParts.join(' ') || 'Admin'
const url = process.env.NUXT_SUPABASE_URL
const secretKey = process.env.NUXT_SUPABASE_SECRET_KEY

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: pnpm admin:create <email> [display name]')
  process.exit(1)
}
if (!url || !secretKey) {
  console.error('Set NUXT_SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY first.')
  process.exit(1)
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
const password = process.env.ADMIN_PASSWORD || `${randomBytes(18).toString('base64url')}A1a`

const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
if (error) {
  console.error(`Could not create user: ${error.message}`)
  process.exit(1)
}

const { error: profileError } = await supabase
  .from('admin_profiles')
  .insert({ user_id: data.user.id, display_name: displayName })

if (profileError) {
  await supabase.auth.admin.deleteUser(data.user.id)
  console.error(`Could not create admin profile: ${profileError.message}`)
  process.exit(1)
}

console.log(`Admin created: ${email}`)
if (!process.env.ADMIN_PASSWORD) console.log(`Temporary password: ${password}`)
console.log('Sign in at /admin/login, set up two-factor authentication, then change the password.')
