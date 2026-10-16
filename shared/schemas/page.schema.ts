import { z } from 'zod'
import { SLUG_MAX_LENGTH } from '../constants'
import { slugSchema } from './article.schema'
import { blockSchema } from './block.schema'
import { seoSchema } from './seo.schema'

export const RESERVED_PAGE_SLUGS = [
  'home', 'admin', 'api', 'article', 'articles', 'service', 'services', 'pricing', 'portfolio',
  'contact', 'quote', 'rss.xml', 'sitemap.xml', 'robots.txt', '_nuxt', '__nuxt_error',
] as const

export const pageKindSchema = z.enum(['home', 'service', 'static'])

const pageSlugSchema = z
  .string()
  .trim()
  .min(1, 'Required')
  .max(SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/, 'Use lowercase words separated by hyphens, and / for nesting')

export const pageSchema = seoSchema.extend({
  title: z.string().trim().min(1, 'Required').max(120),
  slug: pageSlugSchema,
  status: z.enum(['draft', 'published']),
  blocks: z.array(blockSchema).max(40, 'Use at most 40 blocks per page'),
})

export const staticPageSlugSchema = pageSlugSchema.refine(
  slug => !RESERVED_PAGE_SLUGS.includes(slug.split('/')[0] as (typeof RESERVED_PAGE_SLUGS)[number]),
  'This address is used by another part of the site',
)

export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Required').max(80),
  slug: slugSchema,
  summary: z.string().trim().max(300),
  icon: z.string().regex(/^i-[a-z0-9]+(-[a-z0-9]+)+$/, 'Use an Iconify name like i-lucide-smartphone'),
  is_active: z.boolean(),
})

export const serviceOrderSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(50),
})

const planSchema = z.object({
  id: z.uuid().optional(),
  key: z.string().min(1).max(40),
  name: z.string().trim().min(1, 'Required').max(60),
  slug: slugSchema,
  price: z.number().int().min(0).max(100_000_000_000),
  price_suffix: z.string().trim().max(40),
  description: z.string().trim().max(240),
  cta_label: z.string().trim().min(1, 'Required').max(40),
  is_popular: z.boolean(),
})

const featureSchema = z.object({
  id: z.uuid().optional(),
  key: z.string().min(1).max(40),
  label: z.string().trim().min(1, 'Required').max(120),
  group_label: z.string().trim().max(60),
})

const cellSchema = z.object({
  plan_key: z.string().min(1).max(40),
  feature_key: z.string().min(1).max(40),
  value_type: z.enum(['check', 'cross', 'text']),
  value_text: z.string().trim().max(60),
})

export const pricingSchema = z
  .object({
    plans: z.array(planSchema).max(6, 'Use at most 6 plans'),
    features: z.array(featureSchema).max(60),
    cells: z.array(cellSchema).max(360),
  })
  .superRefine((value, ctx) => {
    const slugs = new Set<string>()
    value.plans.forEach((plan, index) => {
      if (slugs.has(plan.slug)) ctx.addIssue({ code: 'custom', message: 'Each plan needs its own slug', path: ['plans', index, 'slug'] })
      slugs.add(plan.slug)
    })
    if (value.plans.filter(plan => plan.is_popular).length > 1) {
      ctx.addIssue({ code: 'custom', message: 'Only one plan can be marked popular', path: ['plans'] })
    }
  })

export type PageInput = z.infer<typeof pageSchema>
export type ServiceInput = z.infer<typeof serviceSchema>
export type PricingInput = z.infer<typeof pricingSchema>
export type PricingPlanInput = z.infer<typeof planSchema>
export type PricingFeatureInput = z.infer<typeof featureSchema>
export type PricingCellInput = z.infer<typeof cellSchema>
