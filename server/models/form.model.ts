import type { Db } from '../utils/supabase'
import type { Json } from '#shared/types/database'
import type { FormInput } from '#shared/schemas/engagement.schema'
import type { AdminForm, FormFieldDef, PublicForm } from '#shared/types/models'

export const FIELD_COLUMNS = 'id, name, label, type, placeholder, help_text, options, required, validation, width, position' as const
const PUBLIC_COLUMNS = `id, key, name, submit_label, success_message, form_fields(${FIELD_COLUMNS})` as const
const ADMIN_COLUMNS = `id, key, name, submit_label, success_message, notify_emails, form_fields(${FIELD_COLUMNS}), submissions(count)` as const

export interface FieldRow {
  id: string
  name: string
  label: string
  type: string
  placeholder: string
  help_text: string
  options: Json
  required: boolean
  validation: Json
  width: string
  position: number
}

interface PublicFormRow {
  id: string
  key: string
  name: string
  submit_label: string
  success_message: string
  form_fields: FieldRow[]
}

export interface FormFieldWrite {
  id: string
  name: string
  label: string
  type: string
  placeholder: string
  help_text: string
  options: { label: string, value: string }[]
  required: boolean
  validation: { min?: number, max?: number }
  width: 'full' | 'half'
}

function isOption(value: unknown): value is { label: string, value: string } {
  return typeof value === 'object' && value !== null
    && typeof (value as { label: unknown }).label === 'string'
    && typeof (value as { value: unknown }).value === 'string'
}

function toValidation(value: Json): FormFieldDef['validation'] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const result: FormFieldDef['validation'] = {}
  if (typeof value.min === 'number') result.min = value.min
  if (typeof value.max === 'number') result.max = value.max
  return result
}

export function toFieldDefs(rows: FieldRow[]): FormFieldDef[] {
  return [...rows]
    .sort((a, b) => a.position - b.position)
    .map(row => ({
      id: row.id,
      name: row.name,
      label: row.label,
      type: row.type,
      placeholder: row.placeholder,
      helpText: row.help_text,
      options: Array.isArray(row.options) ? row.options.filter(isOption) : [],
      required: row.required,
      validation: toValidation(row.validation),
      width: row.width === 'half' ? 'half' : 'full',
    }))
}

function toPublicForm(row: PublicFormRow): PublicForm {
  return {
    key: row.key,
    name: row.name,
    submitLabel: row.submit_label,
    successMessage: row.success_message,
    fields: toFieldDefs(row.form_fields),
  }
}

async function findPublicByKeys(db: Db, keys: string[]): Promise<Record<string, PublicForm>> {
  if (!keys.length) return {}
  const rows = unwrap(await db.from('forms').select(PUBLIC_COLUMNS).in('key', keys)) as unknown as PublicFormRow[]
  return Object.fromEntries(rows.map(row => [row.key, toPublicForm(row)]))
}

async function findForSubmit(db: Db, key: string) {
  const { data, error } = await db
    .from('forms')
    .select(`${PUBLIC_COLUMNS}, notify_emails`)
    .eq('key', key)
    .maybeSingle()
  if (error) throwDbError(error)
  if (!data) return null
  const row = data as unknown as PublicFormRow & { notify_emails: string[] }
  return { id: row.id, notifyEmails: row.notify_emails, form: toPublicForm(row) }
}

interface AdminFormRow extends PublicFormRow {
  notify_emails: string[]
  submissions: { count: number }[]
}

function toAdminForm(row: AdminFormRow): AdminForm {
  return {
    ...toPublicForm(row),
    id: row.id,
    notifyEmails: row.notify_emails,
    submissionCount: row.submissions[0]?.count ?? 0,
  }
}

async function listAdmin(db: Db): Promise<AdminForm[]> {
  const rows = unwrap(await db.from('forms').select(ADMIN_COLUMNS).order('name').limit(100)) as unknown as AdminFormRow[]
  return rows.map(toAdminForm)
}

async function findAdmin(db: Db, id: string): Promise<AdminForm> {
  return toAdminForm(unwrap(await db.from('forms').select(ADMIN_COLUMNS).eq('id', id).single()) as unknown as AdminFormRow)
}

async function listKeys(db: Db) {
  return unwrap(await db.from('forms').select('key, name').order('name').limit(100))
}

async function updateMeta(db: Db, id: string, input: Omit<FormInput, 'fields'>) {
  ensureOk(await db.from('forms').update(input).eq('id', id))
}

async function replaceFields(db: Db, formId: string, fields: FormFieldWrite[]) {
  const keep = fields.map(field => field.id)
  ensureOk(await db.from('form_fields').delete().eq('form_id', formId).not('id', 'in', `(${keep.join(',')})`))
  ensureOk(await db.from('form_fields').upsert(fields.map((field, position) => ({ ...field, form_id: formId, position }))))
}

export const formModel = {
  findPublicByKeys,
  findForSubmit,
  listAdmin,
  findAdmin,
  listKeys,
  updateMeta,
  replaceFields,
}
