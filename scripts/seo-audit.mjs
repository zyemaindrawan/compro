import { pathToFileURL } from 'node:url'

const ARCHIVE = /^\/(articles(\/category\/[^/]+)?|portfolio|services)$/

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function attr(tag, name) {
  const match = new RegExp(`${name}="([^"]*)"`, 'i').exec(tag)
  return match ? decode(match[1]) : null
}

function meta(html, key, value) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]).find(t => attr(t, key) === value)
  return tag ? attr(tag, 'content') : null
}

function canonicalOf(html) {
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(t => attr(t, 'rel') === 'canonical')
  return tag ? attr(tag, 'href') : null
}

function jsonLdTypes(html, errors, path) {
  const types = new Set()
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1])
      for (const node of data['@graph'] ?? [data]) [].concat(node['@type'] ?? []).forEach(type => types.add(type))
    }
    catch {
      errors.push(`${path}: JSON-LD does not parse`)
    }
  }
  return types
}

function expectedTypes(path) {
  const types = ['WebSite', 'Organization', 'WebPage']
  if (path.startsWith('/article/')) types.push('Article', 'BreadcrumbList')
  if (ARCHIVE.test(path)) types.push('CollectionPage')
  if (path.startsWith('/service/') || path.startsWith('/articles/category/')) types.push('BreadcrumbList')
  return types
}

async function sitemapUrls(baseUrl) {
  const xml = await (await fetch(new URL('/sitemap.xml', baseUrl))).text()
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1].trim()))
  if (!xml.includes('<sitemapindex')) return locs
  const nested = await Promise.all(locs.map(loc => fetch(new URL(new URL(loc).pathname, baseUrl)).then(r => r.text())))
  return nested.flatMap(child => [...child.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decode(m[1].trim())))
}

async function auditPage(baseUrl, path, report) {
  const response = await fetch(new URL(path, baseUrl), { redirect: 'manual' })
  if (response.status !== 200) {
    report.errors.push(`${path}: status ${response.status}`)
    return null
  }
  const html = await response.text()
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim()
  const page = {
    path,
    title: title ? decode(title) : null,
    description: meta(html, 'name', 'description'),
    canonical: canonicalOf(html),
    ogTitle: meta(html, 'property', 'og:title'),
    ogDescription: meta(html, 'property', 'og:description'),
    ogUrl: meta(html, 'property', 'og:url'),
    ogImage: meta(html, 'property', 'og:image'),
    robots: meta(html, 'name', 'robots'),
    h1: (html.match(/<h1\b/gi) ?? []).length,
    types: jsonLdTypes(html, report.errors, path),
  }

  for (const key of ['title', 'description', 'canonical', 'ogTitle', 'ogDescription', 'ogUrl']) {
    if (!page[key]) report.errors.push(`${path}: missing ${key}`)
  }
  if (!page.ogImage) report.warnings.push(`${path}: no og:image (upload a default social image in Settings)`)
  if (page.description && (page.description.length < 50 || page.description.length > 170)) {
    report.warnings.push(`${path}: description is ${page.description.length} characters`)
  }
  if (page.h1 !== 1) report.errors.push(`${path}: ${page.h1} h1 elements`)
  if (page.robots?.includes('noindex')) report.errors.push(`${path}: listed in the sitemap but noindex`)
  for (const type of expectedTypes(path)) {
    if (!page.types.has(type)) report.errors.push(`${path}: JSON-LD has no ${type}`)
  }
  return page
}

function duplicates(pages, key, report) {
  const seen = new Map()
  for (const page of pages) {
    const value = page[key]
    if (!value) continue
    if (seen.has(value)) report.errors.push(`duplicate ${key} on ${seen.get(value)} and ${page.path}: "${value}"`)
    else seen.set(value, page.path)
  }
}

async function expectCanonical(baseUrl, path, expectedPath, report) {
  const response = await fetch(new URL(path, baseUrl))
  if (response.status === 404) return
  const canonical = canonicalOf(await response.text())
  const actual = canonical ? new URL(canonical).pathname + new URL(canonical).search : null
  if (actual !== expectedPath) report.errors.push(`${path}: canonical is ${actual}, expected ${expectedPath}`)
}

export async function auditSite(baseUrl) {
  const report = { errors: [], warnings: [], pages: [] }
  const urls = await sitemapUrls(baseUrl)
  if (!urls.length) report.errors.push('sitemap.xml lists no URLs')

  for (const loc of urls) {
    const page = await auditPage(baseUrl, new URL(loc).pathname, report)
    if (page) report.pages.push(page)
  }
  for (const page of report.pages) {
    if (page.canonical && new URL(page.canonical).pathname !== page.path) {
      report.errors.push(`${page.path}: canonical points to ${page.canonical}`)
    }
  }
  for (const key of ['title', 'description', 'canonical']) duplicates(report.pages, key, report)

  await expectCanonical(baseUrl, '/portfolio?service=web-development', '/portfolio', report)
  await expectCanonical(baseUrl, '/articles?page=2', '/articles?page=2', report)
  return report
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const baseUrl = process.argv[2] ?? 'http://localhost:3000'
  const report = await auditSite(baseUrl)
  console.log(`Audited ${report.pages.length} pages from ${baseUrl}/sitemap.xml`)
  report.warnings.forEach(warning => console.log(`warn  ${warning}`))
  report.errors.forEach(error => console.log(`error ${error}`))
  if (report.errors.length) process.exit(1)
  console.log('No errors.')
}
