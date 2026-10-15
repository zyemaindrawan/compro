import { z } from 'zod'

export const seoSchema = z.object({
  meta_title: z.string().trim().max(70, 'Keep it under 70 characters'),
  meta_description: z.string().trim().max(200, 'Keep it under 200 characters'),
  meta_keywords: z.array(z.string().trim().min(1).max(40)).max(10, 'Use at most 10 keywords'),
  canonical_url: z.union([z.url({ protocol: /^https?$/, error: 'Enter a full URL' }), z.literal('')]),
  og_media_id: z.uuid().nullable(),
  noindex: z.boolean(),
})

export const emptySeo = (): SeoInput => ({
  meta_title: '',
  meta_description: '',
  meta_keywords: [],
  canonical_url: '',
  og_media_id: null,
  noindex: false,
})

export type SeoInput = z.infer<typeof seoSchema>
