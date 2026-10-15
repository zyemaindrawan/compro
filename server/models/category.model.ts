import type { Db } from '../utils/supabase'
import type { SeoRow } from '../utils/seo'
import type { CategoryInput } from '#shared/schemas/article.schema'
import type { CategoryDetail, CategorySummary } from '#shared/types/models'

const DETAIL_COLUMNS = `id, name, slug, description, updated_at, ${SEO_COLUMNS}, og_media_id,
  og:media!categories_og_media_id_fkey(${MEDIA_COLUMNS})` as const

async function list(db: Db, options: { withArticlesOnly: boolean }): Promise<CategorySummary[]> {
  let query = db.from('v_category_counts').select('id, name, slug, description, article_count').order('name')
  if (options.withArticlesOnly) query = query.gt('article_count', 0)
  return unwrap(await query).map(row => ({
    id: row.id ?? '',
    name: row.name ?? '',
    slug: row.slug ?? '',
    description: row.description ?? '',
    articleCount: row.article_count ?? 0,
  }))
}

async function findBySlug(db: Db, slug: string): Promise<CategoryDetail | null> {
  const { data, error } = await db.from('categories').select(DETAIL_COLUMNS).eq('slug', slug).maybeSingle()
  if (error) throwDbError(error)
  return data ? toDetail(data) : null
}

async function findById(db: Db, id: string): Promise<CategoryDetail> {
  return toDetail(unwrap(await db.from('categories').select(DETAIL_COLUMNS).eq('id', id).single()))
}

function toDetail(row: {
  id: string
  name: string
  slug: string
  description: string
  updated_at: string
} & SeoRow): CategoryDetail {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    updatedAt: row.updated_at,
    seo: toSeoFields(row),
  }
}

async function create(db: Db, input: CategoryInput, userId: string) {
  return unwrap(await db.from('categories').insert({ ...input, updated_by: userId }).select('id').single()).id
}

async function update(db: Db, id: string, input: CategoryInput, userId: string) {
  ensureOk(await db.from('categories').update({ ...input, updated_by: userId }).eq('id', id))
}

async function slugOf(db: Db, id: string) {
  return unwrap(await db.from('categories').select('slug').eq('id', id).single()).slug
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('categories').delete().eq('id', id))
}

async function sitemapEntries(db: Db) {
  return unwrap(await db.from('categories').select('slug, updated_at, noindex').eq('noindex', false))
}

export const categoryModel = {
  list,
  findBySlug,
  findById,
  create,
  update,
  slugOf,
  remove,
  sitemapEntries,
}
