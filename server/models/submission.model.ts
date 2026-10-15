import type { Db } from '../utils/supabase'
import type { Json } from '#shared/types/database'
import type { SubmissionQuery, SubmissionStatus } from '#shared/schemas/engagement.schema'
import type { Paginated, SubmissionCounts, SubmissionDetail, SubmissionListItem } from '#shared/types/models'
import { FIELD_COLUMNS, toFieldDefs, type FieldRow } from './form.model'

const LIST_COLUMNS = 'id, name, email, status, created_at, form:forms!inner(key, name)' as const
const DETAIL_COLUMNS = `id, name, email, status, note, data, service_slug, plan_slug, source_path, user_agent, created_at, updated_at,
  form:forms!inner(key, name, form_fields(${FIELD_COLUMNS}))` as const
const EXPORT_LIMIT = 5000

export interface SubmissionWrite {
  form_id: string
  data: NonNullable<Json>
  name: string
  email: string
  status: 'new' | 'spam'
  ip_hash: string
  user_agent: string
  source_path: string
  service_slug: string
  plan_slug: string
}

interface ListRow {
  id: string
  name: string
  email: string
  status: string
  created_at: string
  form: { key: string, name: string }
}

type Filter = Pick<SubmissionQuery, 'status' | 'form' | 'q'>

function toListItem(row: ListRow): SubmissionListItem {
  return {
    id: row.id,
    formKey: row.form.key,
    formName: row.form.name,
    name: row.name,
    email: row.email,
    status: row.status as SubmissionStatus,
    createdAt: row.created_at,
  }
}

function searchTerm(q: string) {
  return q.replace(/[,()*\\]/g, ' ').replace(/[%_]/g, match => `\\${match}`).trim()
}

function applyFilter<T extends { eq: (column: string, value: string) => T, neq: (column: string, value: string) => T, or: (filters: string) => T }>(query: T, filter: Filter): T {
  let result = filter.status === 'all' ? query.neq('status', 'spam') : query.eq('status', filter.status)
  if (filter.form) result = result.eq('form.key', filter.form)
  const term = filter.q ? searchTerm(filter.q) : ''
  if (term) result = result.or(`name.ilike.%${term}%,email.ilike.%${term}%`)
  return result
}

async function insert(db: Db, values: SubmissionWrite) {
  return unwrap(await db.from('submissions').insert(values).select('id').single()).id
}

async function listAdmin(db: Db, query: SubmissionQuery): Promise<Paginated<SubmissionListItem>> {
  const from = (query.page - 1) * query.perPage
  const request = applyFilter(db.from('submissions').select(LIST_COLUMNS, { count: 'exact' }), query)
    .order('created_at', { ascending: false })
    .range(from, from + query.perPage - 1)
  const { data, error, count } = await request
  if (error && !isRangeError(error)) throwDbError(error)
  return {
    items: ((data ?? []) as unknown as ListRow[]).map(toListItem),
    total: count ?? 0,
    page: query.page,
    perPage: query.perPage,
  }
}

async function latest(db: Db, limit: number): Promise<SubmissionListItem[]> {
  const rows = unwrap(await db
    .from('submissions')
    .select(LIST_COLUMNS)
    .neq('status', 'spam')
    .order('created_at', { ascending: false })
    .limit(limit)) as unknown as ListRow[]
  return rows.map(toListItem)
}

interface DetailRow extends ListRow {
  note: string
  data: Json
  service_slug: string
  plan_slug: string
  source_path: string
  user_agent: string
  updated_at: string
  form: { key: string, name: string, form_fields: FieldRow[] }
}

async function findById(db: Db, id: string): Promise<SubmissionDetail> {
  const row = unwrap(await db.from('submissions').select(DETAIL_COLUMNS).eq('id', id).single()) as unknown as DetailRow
  return {
    ...toListItem(row),
    data: typeof row.data === 'object' && row.data !== null && !Array.isArray(row.data) ? row.data : {},
    note: row.note,
    serviceSlug: row.service_slug,
    planSlug: row.plan_slug,
    sourcePath: row.source_path,
    userAgent: row.user_agent,
    fields: toFieldDefs(row.form.form_fields),
    updatedAt: row.updated_at,
  }
}

async function update(db: Db, id: string, values: { status: SubmissionStatus, note: string }) {
  ensureOk(await db.from('submissions').update(values).eq('id', id))
}

async function setStatusMany(db: Db, ids: string[], status: SubmissionStatus) {
  ensureOk(await db.from('submissions').update({ status }).in('id', ids))
}

async function removeMany(db: Db, ids: string[]) {
  ensureOk(await db.from('submissions').delete().in('id', ids))
}

async function counts(db: Db): Promise<SubmissionCounts> {
  const row = unwrap(await db.from('v_submission_counts').select('new, contacted, won, lost, spam, all_but_spam').single())
  return {
    new: row.new ?? 0,
    contacted: row.contacted ?? 0,
    won: row.won ?? 0,
    lost: row.lost ?? 0,
    spam: row.spam ?? 0,
    allButSpam: row.all_but_spam ?? 0,
  }
}

interface ExportRow extends Omit<ListRow, 'name' | 'email'> {
  data: Json
  note: string
  service_slug: string
  plan_slug: string
  source_path: string
}

async function exportRows(db: Db, filter: Filter): Promise<ExportRow[]> {
  const request = applyFilter(
    db.from('submissions').select('id, status, note, data, service_slug, plan_slug, source_path, created_at, form:forms!inner(key, name)'),
    filter,
  )
    .order('created_at', { ascending: false })
    .limit(EXPORT_LIMIT)
  return unwrap(await request) as unknown as ExportRow[]
}

export const submissionModel = {
  insert,
  listAdmin,
  latest,
  findById,
  update,
  setStatusMany,
  removeMany,
  counts,
  exportRows,
}
