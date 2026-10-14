import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient, parseCookieHeader } from '@supabase/ssr'
import type { H3Event } from 'h3'
import type { Database } from '#shared/types/database'

export type Db = SupabaseClient<Database>

const SESSION_MAX_AGE = 60 * 60 * 12

declare module 'h3' {
  interface H3EventContext {
    db?: Db
  }
}

let anonClient: Db | undefined

export function supabaseConfig() {
  const { url, key, secretKey } = useRuntimeConfig().supabase
  if (!url || !key) throw new Error('Set NUXT_SUPABASE_URL and NUXT_SUPABASE_KEY.')
  return { url, key, secretKey }
}

export function useDb(event: H3Event): Db {
  if (event.context.db) return event.context.db
  const { url, key } = supabaseConfig()

  event.context.db = createServerClient<Database>(url, key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: !import.meta.dev,
      path: '/',
      maxAge: SESSION_MAX_AGE,
    },
    cookies: {
      getAll: () => parseCookieHeader(getHeader(event, 'cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' })),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          setCookie(event, name, value, { ...options, httpOnly: true })
        }
      },
    },
    auth: { flowType: 'pkce', detectSessionInUrl: false },
  })
  return event.context.db
}

export function useAnonDb(): Db {
  if (!anonClient) {
    const { url, key } = supabaseConfig()
    anonClient = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return anonClient
}
