import { z } from 'zod'
import { ADMIN_PAGE_SIZE, SLUG_MAX_LENGTH } from '../constants'
import { SLUG_PATTERN } from '../utils/slug'
import { seoSchema } from './seo.schema'

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(SLUG_MAX_LENGTH, `Keep it under ${SLUG_MAX_LENGTH} characters`)
  .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and single hyphens')

export const articleStatusSchema = z.enum(['draft', 'published'])

export const articleSchema = seoSchema.extend({
  title: z.string().trim().min(1, 'Required').max(160),
  slug: slugSchema,
  excerpt: z.string().trim().max(300, 'Keep it under 300 characters'),
  content_json: z.record(z.string(), z.unknown()),
  content_html: z.string().max(500_000, 'This article is too long'),
  cover_media_id: z.uuid().nullable(),
  category_ids: z.array(z.uuid()).max(10, 'Pick at most 10 categories'),
  status: articleStatusSchema,
  published_at: z.iso.datetime({ offset: true }).nullable(),
})

export const categorySchema = seoSchema.extend({
  name: z.string().trim().min(1, 'Required').max(80),
  slug: slugSchema,
  description: z.string().trim().max(500),
})

export const adminArticleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(ADMIN_PAGE_SIZE),
  q: z.string().trim().max(100).optional(),
  status: articleStatusSchema.optional(),
})

export const publicArticleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  perPage: z.coerce.number().int().min(1).max(24).default(9),
  q: z.string().trim().max(100).optional(),
  category: slugSchema.optional(),
})

export const idsSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(100),
})

export type ArticleInput = z.infer<typeof articleSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type AdminArticleQuery = z.infer<typeof adminArticleQuerySchema>
export type PublicArticleQuery = z.infer<typeof publicArticleQuerySchema>
