import type { H3Event } from 'h3'
import { z } from 'zod'
import {
  adminArticleQuerySchema,
  articleSchema,
  idsSchema,
  publicArticleQuerySchema,
  slugSchema,
} from '#shared/schemas/article.schema'
import type { ArticlePageData } from '#shared/types/models'
import type { Json } from '#shared/types/database'
import { articleModel } from '../models/article.model'
import { redirectModel } from '../models/redirect.model'
import { cacheService } from '../services/cache.service'
import { contentService } from '../services/content.service'

const idParams = z.object({ id: z.uuid('Invalid id') })
const slugParams = z.object({ slug: slugSchema })

async function publicList(event: H3Event) {
  const query = validateQuery(event, publicArticleQuerySchema)
  const db = useAnonDb()
  if (query.q) return articleModel.search(db, { q: query.q, page: query.page, perPage: query.perPage })
  return articleModel.listPublished(db, query)
}

async function publicShow(event: H3Event): Promise<ArticlePageData> {
  const { slug } = validateParams(event, slugParams)
  const db = useAnonDb()
  const article = await articleModel.findPublishedBySlug(db, slug)
  if (!article) fail(404, 'Article not found.')
  return { article, related: await articleModel.related(db, article.id) }
}

async function adminList(event: H3Event) {
  const query = validateQuery(event, adminArticleQuerySchema)
  return articleModel.listAdmin(useDb(event), query)
}

async function adminShow(event: H3Event) {
  const { id } = validateParams(event, idParams)
  return articleModel.findAdmin(useDb(event), id)
}

async function preview(event: H3Event): Promise<ArticlePageData> {
  const { id } = validateParams(event, idParams)
  const db = useDb(event)
  const article = await articleModel.findDetailById(db, id)
  return { article, related: await articleModel.related(db, id) }
}

async function save(event: H3Event, id?: string) {
  const admin = await requireAdmin(event)
  const { category_ids: categoryIds, ...input } = await validateBody(event, articleSchema)
  const db = useDb(event)

  const contentHtml = contentService.sanitizeArticleHtml(input.content_html)
  const values = {
    ...input,
    content_json: input.content_json as NonNullable<Json>,
    content_html: contentHtml,
    reading_minutes: contentService.readingMinutes(contentHtml),
    published_at: input.status === 'published' ? input.published_at ?? new Date().toISOString() : input.published_at,
    updated_by: admin.userId,
  }

  let articleId = id
  if (articleId) {
    const previous = await articleModel.findState(db, articleId)
    await articleModel.update(db, articleId, values)
    if (previous.status === 'published' && previous.slug !== values.slug) {
      await redirectModel.recordMove(db, `/article/${previous.slug}`, `/article/${values.slug}`)
    }
  }
  else {
    articleId = await articleModel.create(db, { ...values, author_id: admin.userId })
  }

  await articleModel.setCategories(db, articleId, categoryIds)
  await cacheService.purgePublic()
  return articleModel.findAdmin(db, articleId)
}

async function create(event: H3Event) {
  return save(event)
}

async function update(event: H3Event) {
  const { id } = validateParams(event, idParams)
  return save(event, id)
}

async function remove(event: H3Event) {
  await requireAdmin(event)
  const { ids } = await validateBody(event, idsSchema)
  await articleModel.removeMany(useDb(event), ids)
  await cacheService.purgePublic()
  return { ok: true, removed: ids.length }
}

export const articleController = {
  publicList,
  publicShow,
  adminList,
  adminShow,
  preview,
  create,
  update,
  remove,
}
