import type { Db } from '../utils/supabase'
import type { SettingsInput, SocialLinkInput, WorkHour } from '#shared/schemas/settings.schema'
import type { MarqueeSettings, SiteSettings, SocialLink } from '#shared/types/models'
import { DEFAULT_TIMEZONE } from '#shared/constants'

const SETTINGS_COLUMNS = `
  site_name, title_template, tagline, description, phone, whatsapp_number, whatsapp_message,
  email, address, map_url, work_hours, timezone, umami_website_id, umami_script_url, marquee, updated_at,
  logo_light:media!site_settings_logo_light_media_id_fkey(${MEDIA_COLUMNS}),
  logo_dark:media!site_settings_logo_dark_media_id_fkey(${MEDIA_COLUMNS}),
  favicon:media!site_settings_favicon_media_id_fkey(${MEDIA_COLUMNS}),
  default_og:media!site_settings_default_og_media_id_fkey(${MEDIA_COLUMNS})
` as const

const SOCIAL_COLUMNS = 'id, platform, label, url, icon, is_active' as const

function toMarquee(value: unknown): MarqueeSettings {
  const raw = (value ?? {}) as Record<string, unknown>
  return {
    autoplay: raw.autoplay !== false,
    speed: typeof raw.speed === 'number' ? raw.speed : 40,
    pauseOnHover: raw.pause_on_hover !== false,
  }
}

async function getSettings(db: Db, options: { activeLinksOnly: boolean }): Promise<SiteSettings> {
  let linksQuery = db.from('social_links').select(SOCIAL_COLUMNS).order('position')
  if (options.activeLinksOnly) linksQuery = linksQuery.eq('is_active', true)

  const [settingsResult, linksResult] = await Promise.all([
    db.from('site_settings').select(SETTINGS_COLUMNS).eq('id', 1).single(),
    linksQuery,
  ])
  const row = unwrap(settingsResult)
  const links = unwrap(linksResult)

  return {
    siteName: row.site_name,
    titleTemplate: row.title_template,
    tagline: row.tagline,
    description: row.description,
    logoLight: toMediaAsset(row.logo_light),
    logoDark: toMediaAsset(row.logo_dark),
    favicon: toMediaAsset(row.favicon),
    defaultOg: toMediaAsset(row.default_og),
    phone: row.phone,
    whatsappNumber: row.whatsapp_number,
    whatsappMessage: row.whatsapp_message,
    email: row.email,
    address: row.address,
    mapUrl: row.map_url,
    workHours: Array.isArray(row.work_hours) ? (row.work_hours as unknown as WorkHour[]) : [],
    timezone: row.timezone || DEFAULT_TIMEZONE,
    umamiWebsiteId: row.umami_website_id,
    umamiScriptUrl: row.umami_script_url,
    marquee: toMarquee(row.marquee),
    updatedAt: row.updated_at,
    socialLinks: links.map((link): SocialLink => ({
      id: link.id,
      platform: link.platform,
      label: link.label,
      url: link.url,
      icon: link.icon,
      isActive: link.is_active,
    })),
  }
}

async function getSiteName(db: Db) {
  const row = unwrap(await db.from('site_settings').select('site_name').eq('id', 1).single())
  return row.site_name
}

async function getMediaIds(db: Db) {
  return unwrap(await db
    .from('site_settings')
    .select('logo_light_media_id, logo_dark_media_id, favicon_media_id, default_og_media_id')
    .eq('id', 1)
    .single())
}

async function updateSettings(db: Db, input: SettingsInput, userId: string) {
  ensureOk(await db.from('site_settings').update({ ...input, updated_by: userId }).eq('id', 1))
}

async function replaceSocialLinks(db: Db, links: SocialLinkInput[]) {
  const rows = links.map((link, position) => ({
    id: link.id ?? crypto.randomUUID(),
    platform: link.platform,
    label: link.label,
    url: link.url,
    icon: link.icon,
    is_active: link.is_active,
    position,
  }))

  const keepIds = rows.map(row => row.id)
  const removal = db.from('social_links').delete()
  ensureOk(await (keepIds.length
    ? removal.not('id', 'in', `(${keepIds.join(',')})`)
    : removal.not('id', 'is', null)))

  if (rows.length) ensureOk(await db.from('social_links').upsert(rows))
}

export const settingsModel = {
  getSettings,
  getSiteName,
  getMediaIds,
  updateSettings,
  replaceSocialLinks,
}
