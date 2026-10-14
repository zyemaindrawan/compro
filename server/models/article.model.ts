import type { Db } from '../utils/supabase'
import type { SeoRow } from '../utils/seo'
import type { MediaRow } from '../utils/media'
import type { AdminArticleQuery } from '#shared/schemas/article.schema'
import type { Json } from '#shared/types/database'
import type {
  AdminArticle,
  AdminArticleListItem,
  ArticleDetail,
  ArticleSummary,
  CategoryRef,
  Paginated,
} from '#shared/types/models'

const SUMMARY_COLUMNS = `id, title, slug, excerpt, published_at, reading_minutes,
  cover:media!articles_cover_media_id_fkey(${MEDIA_COLUMNS}),
  categories(name, slug)` as const

const DETAIL_COLUMNS = `${SUMMARY_COLUMNS}, content_html, updated_at, ${SEO_COLUMNS},
  og:media!articles_og_media_id_fkey(${MEDIA_COLUMNS}),
  author:admin_profiles(display_name, bio, avatar:media!admin_profiles_avatar_media_id_fkey(${MEDIA_COLUMNS}))` as const

const ADMIN_COLUMNS = `id, title, slug, excerpt, content_json, content_html, status, published_at, updated_at, ${SEO_COLUMNS},
  cover:media!articles_cover_media_id_fkey(${MEDIA_COLUMNS}),
  og:media!articles_og_media_id_fkey(${MEDIA_COLUMNS}),
  article_categories(category_id)` as const

interface SummaryRow {
  id: string
  title: string
  slug: string
  excerpt: string
  published_at: string | null
  reading_minutes: number
  cover: MediaRow | null
  categories: CategoryRef[]
}

export interface ArticleWrite {
  title: string
  slug: string
  excerpt: string
  content_json: NonNullable<Json>
  content_html: string
  cover_media_id: string | null
  status: 'draft' | 'published'
  published_at: string | null
  reading_minutes: number
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  canonical_url: string
  og_media_id: string | null
  noindex: boolean
  author_id: string
  updated_by: string
}

function toSummary(row: SummaryRow): ArticleSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    publishedAt: row.published_at,
    readingMinutes: row.reading_minutes,
    cover: toMediaAsset(row.cover),
    categories: [...row.categories].sort((a, b) => a.name.localeCompare(b.name)),
  }
}

function publishedOnly<T extends { eq: (column: 'status', value: 'published') => T, lte: (column: 'published_at', value: string) => T }>(query: T) {
  return query.eq('status', 'published').lte('published_at', new Date().toISOString())
}

async function listPublished(db: Db, options: { page: number, perPage: number, category?: string }): Promise<Paginated<ArticleSummary>> {
  const from = (options.page - 1) * options.perPage
  const columns = options.category ? `${SUMMARY_COLUMNS}, filter:categories!inner(slug)` : SUMMARY_COLUMNS
  let query = publishedOnly(db.from('articles').select(columns, { count: 'exact' }))
  if (options.category) query = query.eq('filter.slug', options.category)

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(from, from + options.perPage - 1)
  if (error) throwDbError(error)

  return {
    items: (data as unknown as SummaryRow[]).map(toSummary),
    total: count ?? 0,
    page: options.page,
    perPage: options.perPage,
  }
}

async function search(db: Db, options: { q: string, page: number, perPage: number }): Promise<Paginated<ArticleSummary>> {
  const hits = unwrap(await db.rpc('fn_search_articles', {
    p_query: options.q,
    p_limit: options.perPage,
    p_offset: (options.page - 1) * options.perPage,
  }))
  if (!hits.length) return { items: [], total: 0, page: options.page, perPage: options.perPage }

  const rows = unwrap(await db.from('articles').select(SUMMARY_COLUMNS).in('id', hits.map(hit => hit.id)))
  const byId = new Map((rows as unknown as SummaryRow[]).map(row => [row.id, row]))

  return {
    items: hits.flatMap((hit) => {
      const row = byId.get(hit.id)
      return row ? [toSummary(row)] : []
    }),
    total: Number(hits[0]?.total_count ?? 0),
    page: options.page,
    perPage: options.perPage,
  }
}

async function findPublishedBySlug(db: Db, slug: string): Promise<ArticleDetail | null> {
  const { data, error } = await publishedOnly(db.from('articles').select(DETAIL_COLUMNS).eq('slug', slug)).maybeSingle()
  if (error) throwDbError(error)
  return data ? toDetail(data as unknown as DetailRow) : null
}

async function findDetailById(db: Db, id: string): Promise<ArticleDetail> {
  const data = unwrap(await db.from('articles').select(DETAIL_COLUMNS).eq('id', id).single())
  return toDetail(data as unknown as DetailRow)
}

type DetailRow = SummaryRow & SeoRow & {
  content_html: string
  updated_at: string
  author: { display_name: string, bio: string, avatar: MediaRow | null } | null
}

function toDetail(row: DetailRow): ArticleDetail {
  return {
    ...toSummary(row),
    contentHtml: row.content_html,
    updatedAt: row.updated_at,
    seo: toSeoFields(row),
    author: row.author
      ? { displayName: row.author.display_name, bio: row.author.bio, avatar: toMediaAsset(row.author.avatar) }
      : null,
  }
}

async function related(db: Db, articleId: string, limit = 3): Promise<ArticleSummary[]> {
  const rows = unwrap(await db.rpc('fn_related_articles', { p_article_id: articleId, p_limit: limit }).select(SUMMARY_COLUMNS))
  return (rows as unknown as SummaryRow[]).map(toSummary)
}

async function latest(db: Db, limit: number): Promise<ArticleSummary[]> {
  const rows = unwrap(await publishedOnly(db.from('articles').select(SUMMARY_COLUMNS))
    .order('published_at', { ascending: false })
    .limit(limit))
  return (rows as unknown as SummaryRow[]).map(toSummary)
}

async function feed(db: Db, limit: number) {
  return unwrap(await publishedOnly(db.from('articles').select('title, slug, excerpt, published_at, updated_at, categories(name)'))
    .eq('noindex', false)
    .order('published_at', { ascending: false })
    .limit(limit))
}

async function sitemapEntries(db: Db) {
  return unwrap(await publishedOnly(db.from('articles').select('slug, updated_at'))
    .eq('noindex', false)
    .order('published_at', { ascending: false }))
}

async function listAdmin(db: Db, query: AdminArticleQuery): Promise<Paginated<AdminArticleListItem>> {
  const from = (query.page - 1) * query.perPage
  let request = db
    .from('articles')
    .select('id, title, slug, status, published_at, updated_at, categories(name, slug)', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, from + query.perPage - 1)
  if (query.status) request = request.eq('status', query.status)
  if (query.q) request = request.ilike('title', `%${query.q.replace(/[%_]/g, m => `\\${m}`)}%`)

  const { data, error, count } = await request
  if (error) throwDbError(error)

  return {
    items: data.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status as AdminArticleListItem['status'],
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      categories: row.categories,
    })),
    total: count ?? 0,
    page: query.page,
    perPage: query.perPage,
  }
}

async function findAdmin(db: Db, id: string): Promise<AdminArticle> {
  const row = unwrap(await db.from('articles').select(ADMIN_COLUMNS).eq('id', id).single())
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    contentJson: (row.content_json ?? {}) as Record<string, unknown>,
    contentHtml: row.content_html,
    status: row.status as AdminArticle['status'],
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    cover: toMediaAsset(row.cover),
    categoryIds: row.article_categories.map(link => link.category_id),
    seo: toSeoFields(row),
  }
}

async function findState(db: Db, id: string) {
  return unwrap(await db.from('articles').select('slug, status').eq('id', id).single())
}

async function create(db: Db, values: ArticleWrite) {
  return unwrap(await db.from('articles').insert(values).select('id').single()).id
}

async function update(db: Db, id: string, values: Omit<ArticleWrite, 'author_id'>) {
  ensureOk(await db.from('articles').update(values).eq('id', id))
}

async function setCategories(db: Db, articleId: string, categoryIds: string[]) {
  const removal = db.from('article_categories').delete().eq('article_id', articleId)
  ensureOk(await (categoryIds.length ? removal.not('category_id', 'in', `(${categoryIds.join(',')})`) : removal))
  if (categoryIds.length) {
    ensureOk(await db
      .from('article_categories')
      .upsert(categoryIds.map(categoryId => ({ article_id: articleId, category_id: categoryId })), { ignoreDuplicates: true }))
  }
}

async function removeMany(db: Db, ids: string[]) {
  ensureOk(await db.from('articles').delete().in('id', ids))
}

export const articleModel = {
  listPublished,
  search,
  findPublishedBySlug,
  findDetailById,
  related,
  latest,
  feed,
  sitemapEntries,
  listAdmin,
  findAdmin,
  findState,
  create,
  update,
  setCategories,
  removeMany,
}
