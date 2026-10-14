import type { MediaAsset, MediaVariant } from '#shared/types/models'

export const MEDIA_COLUMNS = 'id, bucket, path, alt, width, height, mime, size_bytes, blurhash, variants, created_at' as const

export interface MediaRow {
  id: string
  bucket: string
  path: string
  alt: string
  width: number | null
  height: number | null
  mime: string
  size_bytes: number
  blurhash: string | null
  variants: unknown
  created_at: string
}

interface StoredVariant {
  width: number
  path: string
}

export function publicStorageUrl(bucket: string, path: string) {
  const base = useRuntimeConfig().public.supabase.url.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}

function isStoredVariant(value: unknown): value is StoredVariant {
  return typeof value === 'object' && value !== null
    && typeof (value as StoredVariant).width === 'number'
    && typeof (value as StoredVariant).path === 'string'
}

export function toMediaAsset(row: MediaRow): MediaAsset
export function toMediaAsset(row: MediaRow | null | undefined): MediaAsset | null
export function toMediaAsset(row: MediaRow | null | undefined): MediaAsset | null {
  if (!row) return null
  const variants: MediaVariant[] = Array.isArray(row.variants)
    ? row.variants.filter(isStoredVariant).map(v => ({ width: v.width, url: publicStorageUrl(row.bucket, v.path) }))
    : []

  return {
    id: row.id,
    url: publicStorageUrl(row.bucket, row.path),
    alt: row.alt,
    width: row.width,
    height: row.height,
    mime: row.mime,
    sizeBytes: row.size_bytes,
    blurhash: row.blurhash,
    variants,
    createdAt: row.created_at,
  }
}
