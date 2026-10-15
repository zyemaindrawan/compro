import { createClient } from '@supabase/supabase-js'
import { readAdmin } from './fixtures/admin'
import { expect, test } from './fixtures'

test('anonymous requests to admin APIs are rejected', async ({ anonApi }) => {
  expect((await anonApi.get('/api/admin/settings')).status()).toBe(401)
  expect((await anonApi.get('/api/admin/submissions')).status()).toBe(401)
})

test('a password-only session cannot use admin APIs', async ({ anonApi }) => {
  const admin = readAdmin()
  const login = await anonApi.post('/api/auth/login', { data: { email: admin.email, password: admin.password } })
  expect(login.status()).toBe(200)

  const settings = await anonApi.get('/api/admin/settings')
  expect(settings.status()).toBe(403)
  expect((await settings.json() as { data: { code: string } }).data.code).toBe('mfa_required')
})

test('row level security hides admin data from an aal1 session', async () => {
  const admin = readAdmin()
  const url = process.env.NUXT_SUPABASE_URL!
  const service = createClient(url, process.env.NUXT_SUPABASE_SECRET_KEY!, { auth: { persistSession: false } })
  const { data: form } = await service.from('forms').select('id').eq('key', 'contact').single()
  const { data: inserted } = await service
    .from('submissions')
    .insert({ form_id: form!.id, data: { note: 'rls probe' }, name: 'RLS probe', email: 'rls@example.test', status: 'spam' })
    .select('id')
    .single()

  try {
    const client = createClient(url, process.env.NUXT_SUPABASE_KEY!, { auth: { persistSession: false } })
    const { error: signInError } = await client.auth.signInWithPassword({ email: admin.email, password: admin.password })
    expect(signInError).toBeNull()

    const { data: rows } = await client.from('submissions').select('id')
    expect(rows).toEqual([])
    const { data: updated } = await client.from('services').update({ summary: 'tampered' }).eq('slug', 'web-development').select('id')
    expect(updated ?? []).toEqual([])
    const { data: serviceRow } = await service.from('services').select('summary').eq('slug', 'web-development').single()
    expect(serviceRow!.summary).not.toBe('tampered')
  }
  finally {
    await service.from('submissions').delete().eq('id', inserted!.id)
  }
})
