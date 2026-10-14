import { z } from 'zod'

export interface FieldDefinition {
  name: string
  label: string
  type: string
  required: boolean
  options: { label: string, value: string }[]
  validation: { min?: number, max?: number }
}

const TEXT_LIMIT = 200
const TEXTAREA_LIMIT = 5000

function emptyValue(type: string): unknown {
  if (type === 'checkbox_group') return []
  if (type === 'checkbox') return false
  return ''
}

function stringField(field: FieldDefinition, rule: z.ZodType<string, string>) {
  return field.required
    ? z.string().trim().min(1, 'Required').pipe(rule)
    : z.union([z.literal(''), rule])
}

function textRule(field: FieldDefinition, limit: number) {
  const max = Math.min(field.validation.max ?? limit, limit)
  let rule = z.string().trim().max(max, `Keep it under ${max} characters`)
  if (field.validation.min) rule = rule.min(field.validation.min, `Use at least ${field.validation.min} characters`)
  return field.required ? rule.min(1, 'Required') : rule
}

function numberRule(field: FieldDefinition) {
  let number = z.coerce.number({ error: issue => (issue.input === undefined ? 'Required' : 'Enter a number') })
  if (field.validation.min !== undefined) number = number.min(field.validation.min, `Minimum is ${field.validation.min}`)
  if (field.validation.max !== undefined) number = number.max(field.validation.max, `Maximum is ${field.validation.max}`)
  const blankToUndefined = (value: unknown) => (value === '' ? undefined : value)
  return field.required
    ? z.preprocess(blankToUndefined, number)
    : z.preprocess(blankToUndefined, number.optional()).transform(value => value ?? '')
}

function fieldRule(field: FieldDefinition): z.ZodType {
  const values = field.options.map(option => option.value)
  const choice = z.string().refine(value => values.includes(value), 'Choose one of the options')

  switch (field.type) {
    case 'email':
      return stringField(field, z.email('Enter a valid email'))
    case 'url':
      return stringField(field, z.url({ protocol: /^https?$/, error: 'Enter a full URL' }))
    case 'tel':
      return stringField(field, z.string().regex(/^\+?[\d\s()-]{6,20}$/, 'Enter a valid phone number'))
    case 'date':
      return stringField(field, z.iso.date('Pick a date'))
    case 'select':
    case 'radio':
    case 'budget_range':
      return stringField(field, choice)
    case 'textarea':
      return textRule(field, TEXTAREA_LIMIT)
    case 'number':
      return numberRule(field)
    case 'checkbox_group': {
      const list = z.array(z.string().refine(value => values.includes(value), 'Unknown option'))
      return field.required ? list.min(1, 'Choose at least one') : list
    }
    case 'checkbox':
      return field.required ? z.literal(true, { error: 'Required' }) : z.boolean()
    default:
      return textRule(field, TEXT_LIMIT)
  }
}

export function buildSubmissionSchema(fields: FieldDefinition[]) {
  return z.object(Object.fromEntries(fields.map((field) => {
    const empty = emptyValue(field.type)
    return [field.name, z.preprocess(value => value ?? empty, fieldRule(field))]
  })))
}

export function emptySubmission(fields: FieldDefinition[]): Record<string, unknown> {
  return Object.fromEntries(fields.map(field => [field.name, emptyValue(field.type)]))
}
