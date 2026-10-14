import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '#shared/types/database'

export type Db = SupabaseClient<Database>

let anonClient: Db | undefined

export function useDb(event: H3Event): Promise<Db> {
  return serverSupabaseClient<Database>(event)
}

export function useAnonDb(): Db {
  if (!anonClient) {
    const { url, key } = useRuntimeConfig().public.supabase
    anonClient = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return anonClient
}
