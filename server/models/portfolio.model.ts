import type { Db } from '../utils/supabase'
import type { MediaRow } from '../utils/media'
import type { PortfolioItemInput } from '#shared/schemas/engagement.schema'
import type { AdminPortfolioItem, PortfolioItem } from '#shared/types/models'
import { orderingModel } from './ordering.model'

const COLUMNS = `id, title, external_url, is_active,
  thumbnail:media(${MEDIA_COLUMNS}),
  service:services(id, name, slug)` as const

const PUBLIC_LIMIT = 200

interface PortfolioRow {
  id: string
  title: string
  external_url: string
  is_active: boolean
  thumbnail: MediaRow
  service: { id: string, name: string, slug: string } | null
}

function toItem(row: PortfolioRow): AdminPortfolioItem {
  return {
    id: row.id,
    title: row.title,
    externalUrl: row.external_url,
    thumbnail: toMediaAsset(row.thumbnail),
    service: row.service,
    isActive: row.is_active,
  }
}

function toPublic(row: PortfolioRow): PortfolioItem {
  const { isActive: _isActive, ...item } = toItem(row)
  return item
}

async function listPublic(db: Db, filter: { serviceId?: string | null, limit?: number } = {}): Promise<PortfolioItem[]> {
  let query = db.from('portfolio_items').select(COLUMNS).eq('is_active', true).order('position').limit(filter.limit ?? PUBLIC_LIMIT)
  if (filter.serviceId) query = query.eq('service_id', filter.serviceId)
  const rows = unwrap(await query) as unknown as PortfolioRow[]
  return rows.map(toPublic)
}

async function listAdmin(db: Db): Promise<AdminPortfolioItem[]> {
  const rows = unwrap(await db.from('portfolio_items').select(COLUMNS).order('position').limit(500)) as unknown as PortfolioRow[]
  return rows.map(toItem)
}

async function create(db: Db, input: PortfolioItemInput) {
  const position = await orderingModel.nextPosition(db, 'portfolio_items')
  ensureOk(await db.from('portfolio_items').insert({ ...input, position }))
}

async function update(db: Db, id: string, input: PortfolioItemInput) {
  ensureOk(await db.from('portfolio_items').update(input).eq('id', id))
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('portfolio_items').delete().eq('id', id))
}

export const portfolioModel = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
}
