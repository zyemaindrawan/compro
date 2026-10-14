export const DEFAULT_TIMEZONE = 'Asia/Jakarta'

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number]

export const SLUG_MAX_LENGTH = 80

export const MEDIA_BUCKET = 'media'
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024
export const MEDIA_MAX_DIMENSION = 2400
export const MEDIA_VARIANT_WIDTHS = [480, 960, 1440] as const
export const MEDIA_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
] as const

export const ADMIN_PAGE_SIZE = 24
