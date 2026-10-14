import type { Db } from '../utils/supabase'
import type { ServiceInput } from '#shared/schemas/page.schema'
import type { AdminService, NavService, ServiceCard } from '#shared/types/models'

const CARD_COLUMNS = 'id, name, slug, summary, icon' as const

async function listNav(db: Db): Promise<NavService[]> {
  return unwrap(await db
    .from('services')
    .select('name, slug')
    .eq('is_active', true)
    .order('position'))
}

async function listCards(db: Db, ids?: string[]): Promise<ServiceCard[]> {
  let query = db.from('services').select(CARD_COLUMNS).eq('is_active', true).order('position')
  if (ids?.length) query = query.in('id', ids)
  return unwrap(await query)
}

async function findBySlug(db: Db, slug: string) {
  const { data, error } = await db
    .from('services')
    .select(`${CARD_COLUMNS}, page_id, updated_at`)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throwDbError(error)
  return data
}

async function listAdmin(db: Db): Promise<AdminService[]> {
  const rows = unwrap(await db
    .from('services')
    .select(`${CARD_COLUMNS}, is_active, page_id, pricing_plans(count)`)
    .order('position'))
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    icon: row.icon,
    isActive: row.is_active,
    pageId: row.page_id,
    planCount: row.pricing_plans[0]?.count ?? 0,
  }))
}

async function findState(db: Db, id: string) {
  return unwrap(await db.from('services').select('slug, name, page_id').eq('id', id).single())
}

async function create(db: Db, input: ServiceInput, userId: string) {
  const { count } = await db.from('services').select('id', { count: 'exact', head: true })
  return unwrap(await db
    .from('services')
    .insert({ ...input, position: count ?? 0, updated_by: userId })
    .select('id')
    .single()).id
}

async function update(db: Db, id: string, input: ServiceInput, userId: string) {
  ensureOk(await db.from('services').update({ ...input, updated_by: userId }).eq('id', id))
}

async function setPage(db: Db, id: string, pageId: string) {
  ensureOk(await db.from('services').update({ page_id: pageId }).eq('id', id))
}

async function reorder(db: Db, ids: string[]) {
  const rows = unwrap(await db.from('services').select('id, name, slug').in('id', ids))
  const byId = new Map(rows.map(row => [row.id, row]))
  ensureOk(await db.from('services').upsert(ids.flatMap((id, position) => {
    const row = byId.get(id)
    return row ? [{ ...row, position }] : []
  })))
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('services').delete().eq('id', id))
}

async function sitemapEntries(db: Db) {
  return unwrap(await db.from('services').select('slug, updated_at').eq('is_active', true))
}

export const serviceModel = {
  listNav,
  listCards,
  findBySlug,
  listAdmin,
  findState,
  create,
  update,
  setPage,
  reorder,
  remove,
  sitemapEntries,
}
