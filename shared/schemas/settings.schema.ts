import { z } from 'zod'
import { WEEKDAY_KEYS } from '../constants'
import { isValidTimeZone } from '../utils/format'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
const optionalUrl = z.union([z.url({ protocol: /^https?$/, error: 'Enter a valid URL' }), z.literal('')])
const mediaId = z.uuid().nullable()

export const workHourSchema = z
  .object({
    day: z.enum(WEEKDAY_KEYS),
    open: z.union([time, z.literal('')]),
    close: z.union([time, z.literal('')]),
    closed: z.boolean(),
  })
  .refine(value => value.closed || (value.open && value.close && value.open < value.close), {
    error: 'Opening time must be before closing time',
    path: ['close'],
  })

export const socialLinkSchema = z.object({
  id: z.uuid().optional(),
  platform: z.string().trim().min(1, 'Required').max(40),
  label: z.string().trim().min(1, 'Required').max(40),
  url: z.url({ protocol: /^https?$/, error: 'Enter a valid URL' }),
  icon: z.string().regex(/^i-[a-z0-9]+(-[a-z0-9]+)+$/, 'Use an Iconify name like i-simple-icons-github'),
  is_active: z.boolean(),
})

export const marqueeSchema = z.object({
  autoplay: z.boolean(),
  speed: z.number().int().min(10).max(120),
  pause_on_hover: z.boolean(),
})

export const settingsSchema = z.object({
  site_name: z.string().trim().min(1, 'Required').max(80),
  title_template: z.string().trim().max(120).refine(value => value.includes('%s'), 'Must contain %s'),
  tagline: z.string().trim().max(160),
  description: z.string().trim().max(300),
  logo_light_media_id: mediaId,
  logo_dark_media_id: mediaId,
  favicon_media_id: mediaId,
  default_og_media_id: mediaId,
  phone: z.string().trim().max(40),
  whatsapp_number: z.union([z.string().regex(/^[1-9]\d{7,14}$/, 'Digits only, with country code, e.g. 6281200001234'), z.literal('')]),
  whatsapp_message: z.string().trim().max(300),
  email: z.union([z.email('Enter a valid email'), z.literal('')]),
  address: z.string().trim().max(300),
  map_url: optionalUrl,
  work_hours: z.array(workHourSchema).length(7),
  timezone: z.string().refine(isValidTimeZone, 'Unknown time zone'),
  umami_website_id: z.union([z.uuid('Enter a valid website ID'), z.literal('')]),
  umami_script_url: z.url({ protocol: /^https$/, error: 'Enter an https URL' }),
  marquee: marqueeSchema,
})

export const settingsUpdateSchema = settingsSchema.extend({
  social_links: z.array(socialLinkSchema).max(20),
})

export type WorkHour = z.infer<typeof workHourSchema>
export type SocialLinkInput = z.infer<typeof socialLinkSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>
