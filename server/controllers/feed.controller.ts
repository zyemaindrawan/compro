import type { H3Event } from 'h3'
import { articleModel } from '../models/article.model'
import { categoryModel } from '../models/category.model'
import { settingsModel } from '../models/settings.model'

const FEED_SIZE = 20

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function siteOrigin(event: H3Event) {
  return getSiteConfig(event).url.replace(/\/$/, '')
}

async function rss(event: H3Event) {
  const db = useAnonDb()
  const origin = siteOrigin(event)
  const [settings, articles] = await Promise.all([
    settingsModel.getSettings(db, { activeLinksOnly: true }),
    articleModel.feed(db, FEED_SIZE),
  ])

  const items = articles.map((article) => {
    const url = `${origin}/article/${article.slug}`
    const categories = article.categories.map(category => `<category>${escapeXml(category.name)}</category>`).join('')
    return `<item><title>${escapeXml(article.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid>`
      + `<pubDate>${new Date(article.published_at ?? article.updated_at).toUTCString()}</pubDate>`
      + `<description>${escapeXml(article.excerpt)}</description>${categories}</item>`
  }).join('')

  const lastBuild = articles[0]?.published_at ?? new Date().toISOString()
  setResponseHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>`
    + `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>`
    + `<title>${escapeXml(`Articles · ${settings.siteName}`)}</title>`
    + `<link>${origin}/articles</link>`
    + `<atom:link href="${origin}/rss.xml" rel="self" type="application/rss+xml"/>`
    + `<description>${escapeXml(settings.description || settings.tagline)}</description>`
    + `<language>en</language><lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>`
    + `${items}</channel></rss>`
}

async function sitemapUrls() {
  const db = useAnonDb()
  const [articles, categories] = await Promise.all([
    articleModel.sitemapEntries(db),
    categoryModel.sitemapEntries(db),
  ])
  return [
    ...articles.map(article => ({ loc: `/article/${article.slug}`, lastmod: article.updated_at })),
    ...categories.map(category => ({ loc: `/articles/category/${category.slug}`, lastmod: category.updated_at })),
  ]
}

export const feedController = {
  rss,
  sitemapUrls,
}
