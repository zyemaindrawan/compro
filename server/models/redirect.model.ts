import type { Db } from '../utils/supabase'
import type { RedirectInput, RedirectQuery } from '#shared/schemas/redirect.schema'
import type { AdminRedirect, Paginated } from '#shared/types/models'
import { ADMIN_PAGE_SIZE } from '#shared/constants'

export interface RedirectRule {
  to: string
  status: number
}

const ADMIN_COLUMNS = 'id, from_path, to_path, status_code, updated_at' as const

async function all(db: Db): Promise<Record<string, RedirectRule>> {
  const rows = unwrap(await db.from('redirects').select('from_path, to_path, status_code'))
  return Object.fromEntries(rows.map(row => [row.from_path, { to: row.to_path, status: row.status_code }]))
}

async function recordMove(db: Db, fromPath: string, toPath: string) {
  if (fromPath === toPath) return
  ensureOk(await db.from('redirects').delete().eq('from_path', toPath))
  await retarget(db, fromPath, toPath)
  ensureOk(await db.from('redirects').upsert({ from_path: fromPath, to_path: toPath, status_code: 301 }, { onConflict: 'from_path' }))
}

async function retarget(db: Db, oldTarget: string, newTarget: string) {
  ensureOk(await db.from('redirects').update({ to_path: newTarget }).eq('to_path', oldTarget))
}

function searchTerm(q: string) {
  return q.replace(/[,()*\\]/g, ' ').replace(/[%_]/g, match => `\\${match}`).trim()
}

async function listAdmin(db: Db, query: RedirectQuery): Promise<Paginated<AdminRedirect>> {
  const from = (query.page - 1) * ADMIN_PAGE_SIZE
  let request = db
    .from('redirects')
    .select(ADMIN_COLUMNS, { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1)
  const term = query.q ? searchTerm(query.q) : ''
  if (term) request = request.or(`from_path.ilike.%${term}%,to_path.ilike.%${term}%`)

  const { data, error, count } = await request
  if (error && !isRangeError(error)) throwDbError(error)
  return {
    items: (data ?? []).map(row => ({
      id: row.id,
      fromPath: row.from_path,
      toPath: row.to_path,
      statusCode: row.status_code as AdminRedirect['statusCode'],
      updatedAt: row.updated_at,
    })),
    total: count ?? 0,
    page: query.page,
    perPage: ADMIN_PAGE_SIZE,
  }
}

async function findPaths(db: Db, id: string) {
  return unwrap(await db.from('redirects').select('from_path, to_path').eq('id', id).single())
}

async function create(db: Db, input: RedirectInput) {
  ensureOk(await db.from('redirects').insert(input))
}

async function update(db: Db, id: string, input: RedirectInput) {
  ensureOk(await db.from('redirects').update(input).eq('id', id))
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('redirects').delete().eq('id', id))
}

export const redirectModel = {
  all,
  recordMove,
  retarget,
  listAdmin,
  findPaths,
  create,
  update,
  remove,
}
