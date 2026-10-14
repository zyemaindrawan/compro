import type { H3Event } from 'h3'
import { z } from 'zod'
import { categorySchema, slugSchema } from '#shared/schemas/article.schema'
import { categoryModel } from '../models/category.model'
import { redirectModel } from '../models/redirect.model'
import { cacheService } from '../services/cache.service'

const idParams = z.object({ id: z.uuid('Invalid id') })
const slugParams = z.object({ slug: slugSchema })

async function publicList() {
  return categoryModel.list(useAnonDb(), { withArticlesOnly: true })
}

async function publicShow(event: H3Event) {
  const { slug } = validateParams(event, slugParams)
  const category = await categoryModel.findBySlug(useAnonDb(), slug)
  if (!category) fail(404, 'Category not found.')
  return category
}

async function adminList(event: H3Event) {
  return categoryModel.list(useDb(event), { withArticlesOnly: false })
}

async function adminShow(event: H3Event) {
  const { id } = validateParams(event, idParams)
  return categoryModel.findById(useDb(event), id)
}

async function create(event: H3Event) {
  const admin = await requireAdmin(event)
  const input = await validateBody(event, categorySchema)
  const db = useDb(event)
  const id = await categoryModel.create(db, input, admin.userId)
  await cacheService.purgePublic()
  return categoryModel.findById(db, id)
}

async function update(event: H3Event) {
  const admin = await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const input = await validateBody(event, categorySchema)
  const db = useDb(event)

  const previousSlug = await categoryModel.slugOf(db, id)
  await categoryModel.update(db, id, input, admin.userId)
  if (previousSlug !== input.slug) {
    await redirectModel.recordMove(db, `/articles/category/${previousSlug}`, `/articles/category/${input.slug}`)
  }
  await cacheService.purgePublic()
  return categoryModel.findById(db, id)
}

async function remove(event: H3Event) {
  await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  await categoryModel.remove(useDb(event), id)
  await cacheService.purgePublic()
  return { ok: true }
}

export const categoryController = {
  publicList,
  publicShow,
  adminList,
  adminShow,
  create,
  update,
  remove,
}
