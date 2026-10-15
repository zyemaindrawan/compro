import type { H3Event } from 'h3'
import type { PublicLayoutData } from '#shared/types/models'

const NON_PAGE_PATH = /^\/(?:api|admin|_nuxt|_ipx|__)(?:\/|$)|\.[a-z0-9]+$/i

function isH3Event(event: object): event is H3Event {
  return 'path' in event && typeof event.path === 'string' && '$fetch' in event && typeof event.$fetch === 'function'
}

// The SEO modules fall back to the build-time `site.name` (og:site_name, JSON-LD defaults).
// Feed them the name from site settings instead, read through the cached layout endpoint
// that every page loads anyway, so this adds no database query.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('site-config:init', async ({ event, siteConfig }) => {
    if (!isH3Event(event) || NON_PAGE_PATH.test(event.path.split('?')[0] ?? '/')) return
    const layout = await event.$fetch<PublicLayoutData>('/api/public/layout').catch(() => null)
    if (!layout) return
    siteConfig.push({
      _context: 'site-settings',
      _priority: 1,
      name: layout.settings.siteName,
      description: layout.settings.description,
    })
  })
})
