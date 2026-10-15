import { z } from 'zod'
import { ADMIN_PAGE_SIZE } from '../constants'

const text = (max: number) => z.string().trim().max(max)
const httpUrl = z.url({ protocol: /^https?$/, error: 'Enter a full URL starting with https://' })

export const reorderSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
})

export const portfolioItemSchema = z.object({
  title: text(120).min(1, 'Required'),
  thumbnail_media_id: z.uuid('Choose a thumbnail'),
  external_url: httpUrl,
  service_id: z.uuid().nullable(),
  is_active: z.boolean(),
})

export const clientLogoSchema = z.object({
  name: text(80).min(1, 'Required'),
  logo_media_id: z.uuid('Choose a logo'),
  url: z.union([httpUrl, z.literal('')]),
  is_active: z.boolean(),
})

export const testimonialSchema = z.object({
  author_name: text(80).min(1, 'Required'),
  author_role: text(80),
  company: text(120),
  avatar_media_id: z.uuid().nullable(),
  quote: text(600).min(1, 'Required'),
  rating: z.number().int().min(1).max(5).nullable(),
  is_active: z.boolean(),
})

export const faqSchema = z.object({
  question: text(200).min(1, 'Required'),
  answer: text(2000).min(1, 'Required'),
  group_label: text(60),
  is_active: z.boolean(),
})

export const FORM_FIELD_TYPES = [
  'text', 'email', 'tel', 'url', 'textarea', 'select', 'radio',
  'checkbox', 'checkbox_group', 'number', 'budget_range', 'date',
] as const

export const OPTION_FIELD_TYPES = ['select', 'radio', 'checkbox_group', 'budget_range'] as const

export const fieldOptionSchema = z.object({
  label: text(80).min(1, 'Required'),
  value: z.string().trim().min(1, 'Required').max(80).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens'),
})

export const formFieldSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1, 'Required').max(40).regex(/^[a-z][a-z0-9_]*$/, 'Start with a letter; use lowercase letters, numbers and _'),
    label: text(80).min(1, 'Required'),
    type: z.enum(FORM_FIELD_TYPES),
    placeholder: text(120),
    help_text: text(200),
    options: z.array(fieldOptionSchema).max(30),
    required: z.boolean(),
    validation: z.object({
      min: z.number().int().min(0).optional(),
      max: z.number().int().min(1).optional(),
    }),
    width: z.enum(['full', 'half']),
  })
  .refine(field => !(OPTION_FIELD_TYPES as readonly string[]).includes(field.type) || field.options.length >= 2, {
    error: 'Add at least two options',
    path: ['options'],
  })

export const formSchema = z
  .object({
    name: text(80).min(1, 'Required'),
    submit_label: text(40).min(1, 'Required'),
    success_message: text(300).min(1, 'Required'),
    notify_emails: z.array(z.email('Enter a valid email')).max(10),
    fields: z.array(formFieldSchema).min(1, 'Add at least one field').max(30),
  })
  .superRefine((form, ctx) => {
    const seen = new Set<string>()
    form.fields.forEach((field, index) => {
      if (seen.has(field.name)) ctx.addIssue({ code: 'custom', message: 'Each field needs its own name', path: ['fields', index, 'name'] })
      seen.add(field.name)
    })
    if (!form.fields.some(field => field.type === 'email')) {
      ctx.addIssue({ code: 'custom', message: 'Add an email field so you can reply', path: ['fields'] })
    }
  })

export const SUBMISSION_STATUSES = ['new', 'contacted', 'won', 'lost', 'spam'] as const

export const submissionUpdateSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES),
  note: text(2000),
})

export const submissionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(ADMIN_PAGE_SIZE),
  status: z.enum([...SUBMISSION_STATUSES, 'all']).default('all'),
  form: z.string().trim().max(40).optional(),
  q: z.string().trim().max(100).optional(),
})

export const submissionBulkSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
  status: z.enum(SUBMISSION_STATUSES).optional(),
})

export const formKeySchema = z.string().trim().min(1).max(40).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Invalid form')

export const submissionEnvelopeSchema = z.object({
  values: z.record(z.string(), z.unknown()),
  turnstileToken: z.string().max(4096).default(''),
  formToken: z.string().max(200).default(''),
  website: z.string().max(500).default(''),
  sourcePath: z.string().max(300).regex(/^\//).catch('/'),
  service: z.string().trim().max(80).regex(/^[a-z0-9-]*$/).catch(''),
  plan: z.string().trim().max(80).regex(/^[a-z0-9-]*$/).catch(''),
})

export type PortfolioItemInput = z.infer<typeof portfolioItemSchema>
export type ClientLogoInput = z.infer<typeof clientLogoSchema>
export type TestimonialInput = z.infer<typeof testimonialSchema>
export type FaqInput = z.infer<typeof faqSchema>
export type FormFieldInput = z.infer<typeof formFieldSchema>
export type FormInput = z.infer<typeof formSchema>
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number]
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]
export type SubmissionQuery = z.infer<typeof submissionQuerySchema>
export type SubmissionEnvelope = z.input<typeof submissionEnvelopeSchema>
