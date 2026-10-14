import type { Db } from '../utils/supabase'
import type { NavService } from '#shared/types/models'

async function listNav(db: Db): Promise<NavService[]> {
  const rows = unwrap(await db
    .from('services')
    .select('name, slug')
    .eq('is_active', true)
    .order('position'))
  return rows
}

export const serviceModel = {
  listNav,
}
