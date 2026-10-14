import type { H3Event } from 'h3'
import { z } from 'zod'
import { mediaListQuerySchema, mediaPurposeSchema, mediaUpdateSchema } from '#shared/schemas/media.schema'
import { mediaModel, type StoredObject } from '../models/media.model'
import { mediaService } from '../services/media.service'

const idParams = z.object({ id: z.uuid('Invalid id') })
const uploadFields = z.object({
  alt: z.string().trim().max(200).default(''),
  purpose: mediaPurposeSchema.default('content'),
})

async function list(event: H3Event) {
  const query = validateQuery(event, mediaListQuerySchema)
  return mediaModel.list(useDb(event), query)
}

async function upload(event: H3Event) {
  const admin = await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.filename)
  if (!file) fail(400, 'Choose an image to upload.')

  const fields = parseWith(uploadFields, Object.fromEntries(
    (parts ?? []).filter(part => !part.filename && part.name).map(part => [part.name, part.data.toString('utf8')]),
  ))

  const processed = await mediaService.processUpload(file.data, fields.purpose)
  const mainPath = mediaService.storagePath(processed.main.extension)
  const variants = processed.variants.map(variant => ({
    width: variant.width,
    path: mainPath.replace(/\.webp$/, `-${variant.width}w.webp`),
    body: variant.body,
  }))

  const objects: StoredObject[] = [
    { path: mainPath, body: processed.main.body, contentType: processed.main.contentType },
    ...variants.map(variant => ({ path: variant.path, body: variant.body, contentType: 'image/webp' })),
  ]

  const db = useDb(event)
  await mediaModel.uploadObjects(db, objects)

  try {
    return await mediaModel.insert(db, {
      path: mainPath,
      alt: fields.alt,
      width: processed.main.width,
      height: processed.main.height,
      size_bytes: processed.main.body.byteLength,
      mime: processed.main.contentType,
      variants: variants.map(({ width, path }) => ({ width, path })),
      blurhash: processed.blurhash,
      updated_by: admin.userId,
    })
  }
  catch (error) {
    await mediaModel.removeObjects(db, objects.map(object => object.path))
    throw error
  }
}

async function update(event: H3Event) {
  const admin = await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const input = await validateBody(event, mediaUpdateSchema)
  return mediaModel.updateAlt(useDb(event), id, input.alt, admin.userId)
}

async function remove(event: H3Event) {
  await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const db = useDb(event)
  const row = await mediaModel.findById(db, id)
  await mediaModel.remove(db, id)

  const variantPaths = Array.isArray(row.variants)
    ? row.variants.flatMap(variant => (variant && typeof variant === 'object' && 'path' in variant ? [String(variant.path)] : []))
    : []
  await mediaModel.removeObjects(db, [row.path, ...variantPaths])
  return { ok: true }
}

export const mediaController = {
  list,
  upload,
  update,
  remove,
}
