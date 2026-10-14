import type { Db } from '../utils/supabase'
import type { MediaListQuery } from '#shared/schemas/media.schema'
import type { MediaAsset, Paginated } from '#shared/types/models'
import { MEDIA_BUCKET } from '#shared/constants'

export interface StoredObject {
  path: string
  body: Buffer
  contentType: string
}

export interface NewMediaRow {
  path: string
  alt: string
  width: number | null
  height: number | null
  size_bytes: number
  mime: string
  variants: { width: number, path: string }[]
  blurhash: string | null
  updated_by: string
}

async function list(db: Db, query: MediaListQuery): Promise<Paginated<MediaAsset>> {
  const from = (query.page - 1) * query.perPage
  let request = db
    .from('media')
    .select(MEDIA_COLUMNS, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + query.perPage - 1)

  if (query.q) request = request.ilike('alt', `%${query.q.replace(/[%_]/g, m => `\\${m}`)}%`)

  const { data, error, count } = await request
  if (error) throwDbError(error)

  return {
    items: data.map(row => toMediaAsset(row)),
    total: count ?? 0,
    page: query.page,
    perPage: query.perPage,
  }
}

async function findMany(db: Db, ids: string[]): Promise<Record<string, MediaAsset>> {
  if (!ids.length) return {}
  const rows = unwrap(await db.from('media').select(MEDIA_COLUMNS).in('id', ids))
  return Object.fromEntries(rows.map(row => [row.id, toMediaAsset(row)]))
}

async function findById(db: Db, id: string) {
  return unwrap(await db.from('media').select(MEDIA_COLUMNS).eq('id', id).single())
}

async function uploadObjects(db: Db, objects: StoredObject[]) {
  const results = await Promise.all(objects.map(object =>
    db.storage.from(MEDIA_BUCKET).upload(object.path, object.body, {
      contentType: object.contentType,
      cacheControl: '31536000',
      upsert: false,
    }),
  ))
  const failed = results.find(result => result.error)
  if (failed?.error) {
    await removeObjects(db, objects.map(object => object.path))
    throwDbError(failed.error)
  }
}

async function removeObjects(db: Db, paths: string[]) {
  if (!paths.length) return
  const { error } = await db.storage.from(MEDIA_BUCKET).remove(paths)
  if (error) console.error('[media] failed to remove objects', paths, error.message)
}

async function insert(db: Db, row: NewMediaRow): Promise<MediaAsset> {
  const data = unwrap(await db.from('media').insert(row).select(MEDIA_COLUMNS).single())
  return toMediaAsset(data)
}

async function updateAlt(db: Db, id: string, alt: string, userId: string): Promise<MediaAsset> {
  const data = unwrap(await db
    .from('media')
    .update({ alt, updated_by: userId })
    .eq('id', id)
    .select(MEDIA_COLUMNS)
    .single())
  return toMediaAsset(data)
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('media').delete().eq('id', id))
}

export const mediaModel = {
  list,
  findMany,
  findById,
  uploadObjects,
  removeObjects,
  insert,
  updateAlt,
  remove,
}
