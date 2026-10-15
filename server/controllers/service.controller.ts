import type { H3Event } from 'h3'
import { z } from 'zod'
import { slugSchema } from '#shared/schemas/article.schema'
import { serviceOrderSchema, serviceSchema } from '#shared/schemas/page.schema'
import type { PricingGroup, ServicePageData } from '#shared/types/models'
import { emptySeo } from '#shared/schemas/seo.schema'
import { pageModel } from '../models/page.model'
import { pricingModel } from '../models/pricing.model'
import { redirectModel } from '../models/redirect.model'
import { serviceModel } from '../models/service.model'
import { blockService } from '../services/block.service'
import { cacheService } from '../services/cache.service'
import { toPublicPage } from './page.controller'

const idParams = z.object({ id: z.uuid('Invalid id') })
const slugParams = z.object({ slug: slugSchema })

async function publicList() {
  return serviceModel.listCards(useAnonDb())
}

async function publicShow(event: H3Event): Promise<ServicePageData> {
  const { slug } = validateParams(event, slugParams)
  const db = useAnonDb()
  const service = await serviceModel.findBySlug(db, slug)
  if (!service) fail(404, 'Service not found.')

  const pageRow = service.page_id ? await pageModel.findPublishedById(db, service.page_id) : null
  const page = pageRow ? await toPublicPage(db, pageRow) : null
  const ownGroup = (groups: PricingGroup[]) => groups.find(group => group.service.id === service.id)
  const group = (page && ownGroup(page.data.pricing)) ?? ownGroup(await pricingModel.groups(db, { serviceId: service.id, activeOnly: true }))

  return {
    service: { id: service.id, name: service.name, slug: service.slug, summary: service.summary, icon: service.icon },
    page,
    pricing: group?.plans.length ? group : null,
  }
}

async function adminList(event: H3Event) {
  return serviceModel.listAdmin(useDb(event))
}

async function create(event: H3Event) {
  const admin = await requireAdmin(event)
  const input = await validateBody(event, serviceSchema)
  const db = useDb(event)
  await serviceModel.create(db, input, admin.userId)
  await cacheService.purgePublic()
  return serviceModel.listAdmin(db)
}

async function update(event: H3Event) {
  const admin = await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const input = await validateBody(event, serviceSchema)
  const db = useDb(event)

  const previous = await serviceModel.findState(db, id)
  await serviceModel.update(db, id, input, admin.userId)
  if (previous.slug !== input.slug) {
    await redirectModel.recordMove(db, `/services/${previous.slug}`, `/services/${input.slug}`)
  }
  await cacheService.purgePublic()
  return serviceModel.listAdmin(db)
}

async function reorder(event: H3Event) {
  await requireAdmin(event)
  const { ids } = await validateBody(event, serviceOrderSchema)
  const db = useDb(event)
  await serviceModel.reorder(db, ids)
  await cacheService.purgePublic()
  return serviceModel.listAdmin(db)
}

async function remove(event: H3Event) {
  await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const db = useDb(event)
  const service = await serviceModel.findState(db, id)
  await serviceModel.remove(db, id)
  if (service.page_id) await pageModel.remove(db, service.page_id)
  await cacheService.purgePublic()
  return { ok: true }
}

async function createPage(event: H3Event) {
  const admin = await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const db = useDb(event)
  const service = await serviceModel.findState(db, id)
  if (service.page_id) return { pageId: service.page_id }

  const pageId = await pageModel.create(db, {
    ...emptySeo(),
    title: service.name,
    slug: `services/${service.slug}`,
    kind: 'service',
    status: 'draft',
    updated_by: admin.userId,
  })
  await pageModel.replaceBlocks(db, pageId, blockService.prepareForSave([
    {
      type: 'hero',
      is_visible: true,
      props: {
        eyebrow: 'Services',
        heading: service.name,
        subheading: '',
        primary: { label: 'Get a quote', href: '/quote' },
        secondary: { label: '', href: '' },
        media_id: null,
      },
    },
    { type: 'pricing_table', is_visible: true, props: { heading: 'Pricing', intro: '', service_id: id } },
  ]))
  await serviceModel.setPage(db, id, pageId)
  return { pageId }
}

export const serviceController = {
  publicList,
  publicShow,
  adminList,
  create,
  update,
  reorder,
  remove,
  createPage,
}
