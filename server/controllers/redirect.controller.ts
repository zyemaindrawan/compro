import type { H3Event } from 'h3'
import { z } from 'zod'
import { redirectQuerySchema, redirectSchema, type RedirectInput } from '#shared/schemas/redirect.schema'
import { finalTarget, findLoop } from '#shared/utils/redirect-graph'
import type { Db } from '../utils/supabase'
import { redirectModel } from '../models/redirect.model'
import { cacheService } from '../services/cache.service'

const idParams = z.object({ id: z.uuid('Invalid id') })

async function list(event: H3Event) {
  return redirectModel.listAdmin(useDb(event), validateQuery(event, redirectQuerySchema))
}

async function prepareRule(db: Db, input: RedirectInput, currentFrom?: string): Promise<RedirectInput> {
  const rules = Object.fromEntries(Object.entries(await redirectModel.all(db))
    .filter(([from]) => from !== currentFrom)
    .map(([from, rule]) => [from, rule.to]))
  if (input.from_path in rules) {
    fail(409, 'This path already redirects.', { fields: { from_path: 'Another rule already redirects this path.' } })
  }
  if (findLoop(rules, input.from_path, input.to_path)) {
    fail(422, 'This rule would create a redirect loop.', { fields: { to_path: 'This target leads back to the old path.' } })
  }
  return { ...input, to_path: finalTarget(rules, input.to_path) }
}

async function save(event: H3Event, id?: string) {
  await requireAdmin(event)
  const db = useDb(event)
  const previous = id ? await redirectModel.findPaths(db, id) : null
  const input = await prepareRule(db, await validateBody(event, redirectSchema), previous?.from_path)

  if (id) await redirectModel.update(db, id, input)
  else await redirectModel.create(db, input)
  await redirectModel.retarget(db, input.from_path, input.to_path)

  await cacheService.purgePublic()
  return { ok: true }
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
  await redirectModel.remove(useDb(event), id)
  await cacheService.purgePublic()
  return { ok: true }
}

export const redirectController = {
  list,
  create,
  update,
  remove,
}
