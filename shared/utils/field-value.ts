import type { FormFieldDef } from '../types/models'

export function displayFieldValue(field: Pick<FormFieldDef, 'options'>, value: unknown): string {
  const labelOf = (raw: string) => field.options.find(option => option.value === raw)?.label ?? raw
  if (Array.isArray(value)) return value.map(item => labelOf(String(item))).join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined) return ''
  return labelOf(String(value))
}
