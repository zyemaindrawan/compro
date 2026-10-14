import type { H3Event } from 'h3'
import { z } from 'zod'
import { pageSchema, staticPageSlugSchema } from '#shared/schemas/page.schema'
import type { AdminPage, BlockData, PageBlock, PublicPage } from '#shared/types/models'
import type { Db } from '../utils/supabase'
import { articleModel } from '../models/article.model'
import { clientLogoModel } from '../models/client-logo.model'
import { faqModel } from '../models/faq.model'
import { formModel } from '../models/form.model'
import { mediaModel } from '../models/media.model'
import { pageModel, toBlocks, type PageRow } from '../models/page.model'
import { portfolioModel } from '../models/portfolio.model'
import { pricingModel } from '../models/pricing.model'
import { redirectModel } from '../models/redirect.model'
import { serviceModel } from '../models/service.model'
import { testimonialModel } from '../models/testimonial.model'
import { blockService } from '../services/block.service'
import { cacheService } from '../services/cache.service'

const idParams = z.object({ id: z.uuid('Invalid id') })

export async function resolveBlockData(db: Db, blocks: PageBlock[]): Promise<BlockData> {
  const needs = blockService.requirements(blocks)
  const [media, services, pricing, articleLists, portfolioLists, logos, testimonials, faqs, forms] = await Promise.all([
    mediaModel.findMany(db, needs.mediaIds),
    needs.serviceIds === null ? [] : serviceModel.listCards(db, needs.serviceIds === 'all' ? undefined : needs.serviceIds),
    needs.pricing ? pricingModel.groups(db, { activeOnly: true }) : [],
    Promise.all(needs.articleQueries.map(query =>
      articleModel
        .listPublished(db, { page: 1, perPage: query.limit, category: query.category || undefined })
        .then(result => [query.key, result.items] as const))),
    Promise.all(needs.portfolioQueries.map(query =>
      portfolioModel
        .listPublic(db, { serviceId: query.serviceId, limit: query.limit })
        .then(items => [query.key, items] as const))),
    needs.logos ? clientLogoModel.listPublic(db) : [],
    needs.testimonialLimit ? testimonialModel.listPublic(db, needs.testimonialLimit) : [],
    needs.faqs ? faqModel.listPublic(db) : [],
    formModel.findPublicByKeys(db, needs.formKeys),
  ])
  return {
    media,
    services,
    pricing,
    articles: Object.fromEntries(articleLists),
    portfolio: Object.fromEntries(portfolioLists),
    logos,
    testimonials,
    faqs,
    forms,
  }
}

export async function toPublicPage(db: Db, row: PageRow): Promise<PublicPage> {
  const blocks = blockService.validBlocks(toBlocks(row, true))
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    kind: row.kind,
    updatedAt: row.updated_at,
    seo: toSeoFields(row),
    blocks,
    data: await resolveBlockData(db, blocks),
  }
}

async function home() {
  const db = useAnonDb()
  const row = await pageModel.findPublished(db, { kind: 'home' })
  if (!row) fail(404, 'Home page is not published.')
  return toPublicPage(db, row)
}

async function staticPage(event: H3Event) {
  const parsed = staticPageSlugSchema.safeParse(getRouterParam(event, 'slug') ?? '')
  if (!parsed.success) fail(404, 'Page not found.')
  const db = useAnonDb()
  const row = await pageModel.findPublished(db, { kind: 'static', slug: parsed.data })
  if (!row) fail(404, 'Page not found.')
  return toPublicPage(db, row)
}

async function toAdminPage(db: Db, row: PageRow): Promise<AdminPage> {
  const blocks = toBlocks(row, false)
  const mediaIds = blocks.flatMap(block => (typeof block.props.media_id === 'string' ? [block.props.media_id] : []))
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    kind: row.kind,
    status: row.status,
    updatedAt: row.updated_at,
    seo: toSeoFields(row),
    blocks,
    media: await mediaModel.findMany(db, mediaIds),
  }
}

async function adminList(event: H3Event) {
  return pageModel.listAdmin(useDb(event))
}

async function adminShow(event: H3Event) {
  const { id } = validateParams(event, idParams)
  const db = useDb(event)
  return toAdminPage(db, await pageModel.findById(db, id))
}

async function preview(event: H3Event) {
  const { id } = validateParams(event, idParams)
  const db = useDb(event)
  return toPublicPage(db, await pageModel.findById(db, id))
}

async function save(event: H3Event, id?: string) {
  const admin = await requireAdmin(event)
  const { blocks, ...input } = await validateBody(event, pageSchema)
  const db = useDb(event)
  const previous = id ? await pageModel.findById(db, id) : null
  const kind = previous?.kind ?? 'static'

  const slug = kind === 'static' ? parseWith(staticPageSlugSchema, input.slug) : previous!.slug
  const values = { ...input, slug, updated_by: admin.userId }

  const pageId = previous ? previous.id : await pageModel.create(db, { ...values, kind })
  if (previous) await pageModel.update(db, pageId, values)
  await pageModel.replaceBlocks(db, pageId, blockService.prepareForSave(blocks))

  if (previous && kind === 'static' && previous.status === 'published' && previous.slug !== slug) {
    await redirectModel.recordMove(db, `/${previous.slug}`, `/${slug}`)
  }

  await cacheService.purgePublic()
  return toAdminPage(db, await pageModel.findById(db, pageId))
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
  const { id } = validateParams(event, idParams)
  const db = useDb(event)
  const page = await pageModel.findById(db, id)
  if (page.kind === 'home') fail(422, 'The home page cannot be deleted.')
  await pageModel.remove(db, id)
  await cacheService.purgePublic()
  return { ok: true }
}

export const pageController = {
  home,
  staticPage,
  adminList,
  adminShow,
  preview,
  create,
  update,
  remove,
}
