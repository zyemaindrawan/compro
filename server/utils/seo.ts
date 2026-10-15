import type { SeoFields } from '#shared/types/models'
import type { MediaRow } from './media'

export interface SeoRow {
  meta_title: string
  meta_description: string
  meta_keywords: string[]
  canonical_url: string
  noindex: boolean
  og: MediaRow | null
}

export const SEO_COLUMNS = 'meta_title, meta_description, meta_keywords, canonical_url, noindex' as const

export function toSeoFields(row: SeoRow): SeoFields {
  return {
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    metaKeywords: row.meta_keywords,
    canonicalUrl: row.canonical_url,
    ogImage: toMediaAsset(row.og),
    noindex: row.noindex,
  }
}
