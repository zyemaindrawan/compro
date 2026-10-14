import type { Db } from '../utils/supabase'
import type { SeoRow } from '../utils/seo'
import type { Json } from '#shared/types/database'
import type { AdminPageListItem, PageBlock } from '#shared/types/models'

const PAGE_COLUMNS = `id, title, slug, kind, status, updated_at, ${SEO_COLUMNS},
  og:media!pages_og_media_id_fkey(${MEDIA_COLUMNS}),
  page_blocks(id, type, props, position, is_visible)` as const

export interface PageRow extends SeoRow {
  id: string
  title: string
  slug: string
  kind: 'home' | 'service' | 'static'
  status: 'draft' | 'published'
  updated_at: string
  page_blocks: { id: string, type: string, props: unknown, position: number, is_visible: boolean }[]
}

export interface PageWrite {
  title: string
  slug: string
  status: 'draft' | 'published'
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  canonical_url: string
  og_media_id: string | null
  noindex: boolean
  updated_by: string
}

export interface BlockWrite {
  id: string
  type: string
  props: NonNullable<Json>
  is_visible: boolean
}

export function toBlocks(row: PageRow, visibleOnly: boolean): PageBlock[] {
  return [...row.page_blocks]
    .filter(block => !visibleOnly || block.is_visible)
    .sort((a, b) => a.position - b.position)
    .map(block => ({
      id: block.id,
      type: block.type,
      props: (block.props ?? {}) as Record<string, unknown>,
      isVisible: block.is_visible,
    }))
}

async function findPublished(db: Db, filter: { slug?: string, kind: PageRow['kind'] }): Promise<PageRow | null> {
  let query = db.from('pages').select(PAGE_COLUMNS).eq('status', 'published').eq('kind', filter.kind)
  if (filter.slug) query = query.eq('slug', filter.slug)
  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throwDbError(error)
  return data as unknown as PageRow | null
}

async function findPublishedById(db: Db, id: string): Promise<PageRow | null> {
  const { data, error } = await db.from('pages').select(PAGE_COLUMNS).eq('id', id).eq('status', 'published').maybeSingle()
  if (error) throwDbError(error)
  return data as unknown as PageRow | null
}

async function findById(db: Db, id: string): Promise<PageRow> {
  return unwrap(await db.from('pages').select(PAGE_COLUMNS).eq('id', id).single()) as unknown as PageRow
}

async function listAdmin(db: Db): Promise<AdminPageListItem[]> {
  const rows = unwrap(await db
    .from('pages')
    .select('id, title, slug, kind, status, updated_at, services(id, name)')
    .order('kind')
    .order('title'))
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    kind: row.kind as AdminPageListItem['kind'],
    status: row.status as AdminPageListItem['status'],
    updatedAt: row.updated_at,
    service: row.services[0] ? { id: row.services[0].id, name: row.services[0].name } : null,
  }))
}

async function create(db: Db, values: PageWrite & { kind: PageRow['kind'] }) {
  return unwrap(await db.from('pages').insert(values).select('id').single()).id
}

async function update(db: Db, id: string, values: PageWrite) {
  ensureOk(await db.from('pages').update(values).eq('id', id))
}

async function replaceBlocks(db: Db, pageId: string, blocks: BlockWrite[]) {
  const keep = blocks.map(block => block.id)
  const removal = db.from('page_blocks').delete().eq('page_id', pageId)
  ensureOk(await (keep.length ? removal.not('id', 'in', `(${keep.join(',')})`) : removal))
  if (blocks.length) {
    ensureOk(await db.from('page_blocks').upsert(blocks.map((block, position) => ({ ...block, page_id: pageId, position }))))
  }
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('pages').delete().eq('id', id))
}

async function sitemapEntries(db: Db) {
  return unwrap(await db
    .from('pages')
    .select('slug, updated_at')
    .eq('status', 'published')
    .eq('kind', 'static')
    .eq('noindex', false))
}

export const pageModel = {
  findPublished,
  findPublishedById,
  findById,
  listAdmin,
  create,
  update,
  replaceBlocks,
  remove,
  sitemapEntries,
}
