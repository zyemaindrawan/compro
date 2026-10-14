import type { Db } from '../utils/supabase'
import type { SeoRow } from '../utils/seo'
import type { CategoryInput } from '#shared/schemas/article.schema'
import type { CategoryDetail, CategorySummary } from '#shared/types/models'

const DETAIL_COLUMNS = `id, name, slug, description, updated_at, ${SEO_COLUMNS}, og_media_id,
  og:media!categories_og_media_id_fkey(${MEDIA_COLUMNS})` as const

async function counts(db: Db) {
  const rows = unwrap(await db.from('v_category_counts').select('id, article_count'))
  return new Map(rows.map(row => [row.id, row.article_count ?? 0]))
}

async function list(db: Db, options: { withArticlesOnly: boolean }): Promise<CategorySummary[]> {
  const [rows, articleCounts] = await Promise.all([
    db.from('categories').select('id, name, slug, description').order('name'),
    counts(db),
  ])
  return unwrap(rows)
    .map(row => ({ ...row, articleCount: articleCounts.get(row.id) ?? 0 }))
    .filter(row => !options.withArticlesOnly || row.articleCount > 0)
}

async function findBySlug(db: Db, slug: string): Promise<CategoryDetail | null> {
  const [{ data, error }, countRow] = await Promise.all([
    db.from('categories').select(DETAIL_COLUMNS).eq('slug', slug).maybeSingle(),
    db.from('v_category_counts').select('article_count').eq('slug', slug).maybeSingle(),
  ])
  if (error) throwDbError(error)
  if (!data) return null
  return toDetail(data, countRow.data?.article_count ?? 0)
}

async function findById(db: Db, id: string): Promise<CategoryDetail> {
  const data = unwrap(await db.from('categories').select(DETAIL_COLUMNS).eq('id', id).single())
  return toDetail(data, 0)
}

function toDetail(row: {
  id: string
  name: string
  slug: string
  description: string
  updated_at: string
} & SeoRow, articleCount: number): CategoryDetail {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    articleCount,
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
