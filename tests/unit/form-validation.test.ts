import { describe, expect, it } from 'vitest'
import { buildSubmissionSchema, emptySubmission, type FieldDefinition } from '../../shared/utils/form-validation'

const field = (name: string, type: string, required = false, extra: Partial<FieldDefinition> = {}): FieldDefinition => ({
  name, label: name, type, required, options: [], validation: {}, ...extra,
})

const options = [{ label: 'Small', value: 'small' }, { label: 'Large', value: 'large' }]

const fields = [
  field('name', 'text', true),
  field('email', 'email', true),
  field('phone', 'tel'),
  field('budget', 'budget_range', true, { options }),
  field('topics', 'checkbox_group', false, { options }),
  field('agree', 'checkbox', true),
  field('details', 'textarea', true, { validation: { min: 10 } }),
  field('seats', 'number', false, { validation: { min: 1, max: 50 } }),
]
const schema = buildSubmissionSchema(fields)

const valid = {
  name: 'Jane Cooper',
  email: 'jane@company.com',
  phone: '',
  budget: 'small',
  topics: ['large'],
  agree: true,
  details: 'A portal for 40 suppliers.',
  seats: '12',
}

describe('buildSubmissionSchema', () => {
  it('accepts a complete submission and coerces numbers', () => {
    const result = schema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data?.seats).toBe(12)
  })

  it('reports each invalid field by name', () => {
    const result = schema.safeParse({ ...valid, name: ' ', email: 'nope', budget: 'huge', agree: false, details: 'short', seats: '99' })
    const paths = result.error?.issues.map(issue => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'budget', 'agree', 'details', 'seats']))
  })

  it('treats missing optional fields as empty', () => {
    const { phone: _phone, topics: _topics, seats: _seats, ...rest } = valid
    const result = schema.safeParse(rest)
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ phone: '', topics: [] })
  })

  it('drops keys that are not form fields', () => {
    const result = schema.safeParse({ ...valid, is_admin: true, website: 'spam' })
    expect(result.data).not.toHaveProperty('is_admin')
  })

  it('rejects options that are not defined on the field', () => {
    expect(schema.safeParse({ ...valid, topics: ['other'] }).success).toBe(false)
  })
})

describe('emptySubmission', () => {
  it('gives each field a blank value of the right shape', () => {
    expect(emptySubmission(fields)).toMatchObject({ name: '', topics: [], agree: false })
  })
})

describe('missing values', () => {
  it('reports required fields as Required instead of a type error', () => {
    const result = schema.safeParse({})
    const messages = Object.fromEntries(result.error?.issues.map(issue => [issue.path.join('.'), issue.message]) ?? [])
    expect(messages.name).toBe('Required')
    expect(messages.email).toBe('Required')
    expect(messages.details).toBe('Required')
    expect(messages.budget).toBe('Required')
    expect(messages.agree).toBe('Required')
    expect(messages.phone).toBeUndefined()
    expect(messages.seats).toBeUndefined()
  })
})
