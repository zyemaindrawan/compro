import type { H3Event } from 'h3'
import { z } from 'zod'
import {
  SUBMISSION_STATUSES,
  submissionBulkSchema,
  submissionQuerySchema,
  submissionUpdateSchema,
} from '#shared/schemas/engagement.schema'
import { submissionModel } from '../models/submission.model'

const idParams = z.object({ id: z.uuid('Invalid id') })
const bulkStatusSchema = submissionBulkSchema.extend({ status: z.enum(SUBMISSION_STATUSES) })
const bulkDeleteSchema = submissionBulkSchema.pick({ ids: true })
const exportQuerySchema = submissionQuerySchema.pick({ status: true, form: true, q: true })

async function list(event: H3Event) {
  return submissionModel.listAdmin(useDb(event), validateQuery(event, submissionQuerySchema))
}

async function counts(event: H3Event) {
  return submissionModel.counts(useDb(event))
}

async function show(event: H3Event) {
  const { id } = validateParams(event, idParams)
  return submissionModel.findById(useDb(event), id)
}

async function update(event: H3Event) {
  await requireAdmin(event)
  const { id } = validateParams(event, idParams)
  const input = await validateBody(event, submissionUpdateSchema)
  const db = useDb(event)
  await submissionModel.update(db, id, input)
  return submissionModel.findById(db, id)
}

async function setStatus(event: H3Event) {
  await requireAdmin(event)
  const { ids, status } = await validateBody(event, bulkStatusSchema)
  await submissionModel.setStatusMany(useDb(event), ids, status)
  return { ok: true }
}

async function remove(event: H3Event) {
  await requireAdmin(event)
  const { ids } = await validateBody(event, bulkDeleteSchema)
  await submissionModel.removeMany(useDb(event), ids)
  return { ok: true }
}

function cellText(value: unknown) {
  if (Array.isArray(value)) return value.join('; ')
  if (value === null || value === undefined) return ''
  return String(value)
}

function csvCell(value: unknown) {
  let text = cellText(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

async function exportCsv(event: H3Event) {
  await requireAdmin(event)
  const filter = validateQuery(event, exportQuerySchema)
  const rows = await submissionModel.exportRows(useDb(event), filter)

  const dataKeys = [...new Set(rows.flatMap(row => (
    typeof row.data === 'object' && row.data !== null && !Array.isArray(row.data) ? Object.keys(row.data) : []
  )))]
  const header = ['submitted_at', 'form', 'status', 'picked_service', 'picked_plan', 'source_page', 'note', ...dataKeys]
  const lines = rows.map((row) => {
    const data = typeof row.data === 'object' && row.data !== null && !Array.isArray(row.data) ? row.data : {}
    return [
      row.created_at, row.form.key, row.status,
      row.service_slug, row.plan_slug, row.source_path, row.note,
      ...dataKeys.map(key => data[key]),
    ].map(csvCell).join(',')
  })

  const stamp = new Date().toISOString().slice(0, 10)
  setResponseHeaders(event, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="submissions-${stamp}.csv"`,
    'Cache-Control': 'no-store',
  })
  return `\uFEFF${[header.join(','), ...lines].join('\r\n')}\r\n`
}

export const submissionController = {
  list,
  counts,
  show,
  update,
  setStatus,
  remove,
  exportCsv,
}
