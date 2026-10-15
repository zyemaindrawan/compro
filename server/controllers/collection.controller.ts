import type { H3Event } from 'h3'
import { z } from 'zod'
import {
  clientLogoSchema,
  faqSchema,
  portfolioItemSchema,
  reorderSchema,
  testimonialSchema,
} from '#shared/schemas/engagement.schema'
import type { PortfolioPageData } from '#shared/types/models'
import type { Db } from '../utils/supabase'
import { clientLogoModel } from '../models/client-logo.model'
import { faqModel } from '../models/faq.model'
import { orderingModel, type OrderedTable } from '../models/ordering.model'
import { portfolioModel } from '../models/portfolio.model'
import { testimonialModel } from '../models/testimonial.model'
import { cacheService } from '../services/cache.service'

const idParams = z.object({ id: z.uuid('Invalid id') })

interface CollectionModel<TInput, TItem> {
  listAdmin: (db: Db) => Promise<TItem[]>
  create: (db: Db, input: TInput) => Promise<void>
  update: (db: Db, id: string, input: TInput) => Promise<void>
  remove: (db: Db, id: string) => Promise<void>
}

function collectionController<TSchema extends z.ZodType, TItem>(
  table: OrderedTable,
  schema: TSchema,
  model: CollectionModel<z.infer<TSchema>, TItem>,
) {
  async function afterWrite(db: Db) {
    await cacheService.purgePublic()
    return model.listAdmin(db)
  }

  return {
    async list(event: H3Event) {
      return model.listAdmin(useDb(event))
    },
    async create(event: H3Event) {
      await requireAdmin(event)
      const input = await validateBody(event, schema)
      const db = useDb(event)
      await model.create(db, input)
      return afterWrite(db)
    },
    async update(event: H3Event) {
      await requireAdmin(event)
      const { id } = validateParams(event, idParams)
      const input = await validateBody(event, schema)
      const db = useDb(event)
      await model.update(db, id, input)
      return afterWrite(db)
    },
    async reorder(event: H3Event) {
      await requireAdmin(event)
      const { ids } = await validateBody(event, reorderSchema)
      const db = useDb(event)
      await orderingModel.reorder(db, table, ids)
      return afterWrite(db)
    },
    async remove(event: H3Event) {
      await requireAdmin(event)
      const { id } = validateParams(event, idParams)
      const db = useDb(event)
      await model.remove(db, id)
      return afterWrite(db)
    },
  }
}

async function publicPortfolio(): Promise<PortfolioPageData> {
  const items = await portfolioModel.listPublic(useAnonDb())
  const services = new Map(items.flatMap(item => (item.service ? [[item.service.id, item.service] as const] : [])))
  return { items, services: [...services.values()] }
}

export const portfolioController = {
  ...collectionController('portfolio_items', portfolioItemSchema, portfolioModel),
  publicList: publicPortfolio,
}

export const clientLogoController = collectionController('client_logos', clientLogoSchema, clientLogoModel)
export const testimonialController = collectionController('testimonials', testimonialSchema, testimonialModel)
export const faqController = collectionController('faqs', faqSchema, faqModel)
