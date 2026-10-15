import { z } from 'zod'
import { ADMIN_PAGE_SIZE } from '../constants'

export const mediaPurposeSchema = z.enum(['content', 'logo', 'favicon'])

export const mediaUpdateSchema = z.object({
  alt: z.string().trim().max(200),
})

export const mediaListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(96).default(ADMIN_PAGE_SIZE),
  q: z.string().trim().max(100).optional(),
})

export type MediaPurpose = z.infer<typeof mediaPurposeSchema>
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>
