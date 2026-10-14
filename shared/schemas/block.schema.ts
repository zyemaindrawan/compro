import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const href = z.string().trim().max(300).regex(/^(\/|https?:\/\/|mailto:|tel:)/, 'Start with /, https://, mailto: or tel:')
const optionalHref = z.union([href, z.literal('')])

export const linkSchema = z.object({
  label: text(40),
  href: optionalHref,
})

export const heroPropsSchema = z.object({
  eyebrow: text(60),
  heading: text(120).min(1, 'Required'),
  subheading: text(300),
  primary: linkSchema,
  secondary: linkSchema,
  media_id: z.uuid().nullable(),
})

export const richTextPropsSchema = z.object({
  content_json: z.record(z.string(), z.unknown()),
  content_html: z.string().max(200_000),
})

export const imageTextPropsSchema = z.object({
  heading: text(120).min(1, 'Required'),
  body: text(1200),
  media_id: z.uuid().nullable(),
  image_side: z.enum(['left', 'right']),
  cta: linkSchema,
})

export const servicesGridPropsSchema = z.object({
  heading: text(120),
  intro: text(300),
  service_ids: z.array(z.uuid()).max(12),
})

export const pricingTablePropsSchema = z.object({
  heading: text(120),
  intro: text(300),
  service_id: z.uuid().nullable(),
})

export const latestArticlesPropsSchema = z.object({
  heading: text(120),
  limit: z.union([z.literal(3), z.literal(6)]),
  category_slug: z.string().trim().max(80),
})

export const statsPropsSchema = z.object({
  heading: text(120),
  items: z.array(z.object({ value: text(16).min(1, 'Required'), label: text(60).min(1, 'Required') })).min(1).max(6),
})

export const ctaPropsSchema = z.object({
  heading: text(120).min(1, 'Required'),
  body: text(300),
  primary: linkSchema,
})

export const blockSchemas = {
  hero: heroPropsSchema,
  rich_text: richTextPropsSchema,
  image_text: imageTextPropsSchema,
  services_grid: servicesGridPropsSchema,
  pricing_table: pricingTablePropsSchema,
  latest_articles: latestArticlesPropsSchema,
  stats: statsPropsSchema,
  cta: ctaPropsSchema,
} as const

export type BlockType = keyof typeof blockSchemas
export const BLOCK_TYPES = Object.keys(blockSchemas) as BlockType[]

const blockBase = {
  id: z.uuid().optional(),
  is_visible: z.boolean(),
}

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ ...blockBase, type: z.literal('hero'), props: heroPropsSchema }),
  z.object({ ...blockBase, type: z.literal('rich_text'), props: richTextPropsSchema }),
  z.object({ ...blockBase, type: z.literal('image_text'), props: imageTextPropsSchema }),
  z.object({ ...blockBase, type: z.literal('services_grid'), props: servicesGridPropsSchema }),
  z.object({ ...blockBase, type: z.literal('pricing_table'), props: pricingTablePropsSchema }),
  z.object({ ...blockBase, type: z.literal('latest_articles'), props: latestArticlesPropsSchema }),
  z.object({ ...blockBase, type: z.literal('stats'), props: statsPropsSchema }),
  z.object({ ...blockBase, type: z.literal('cta'), props: ctaPropsSchema }),
])

export type BlockInput = z.infer<typeof blockSchema>
export type BlockProps<T extends BlockType> = z.infer<(typeof blockSchemas)[T]>

export function parseBlockProps<T extends BlockType>(type: T, props: unknown): BlockProps<T> | null {
  const result = blockSchemas[type].safeParse(props)
  return result.success ? (result.data as BlockProps<T>) : null
}

export function isBlockType(value: string): value is BlockType {
  return value in blockSchemas
}
