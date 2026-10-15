import { expect, test, uniqueIp } from './fixtures'

const LAYOUT = 3
const REDIRECTS = 1
const PAGE_BASE = LAYOUT + REDIRECTS

const API_BUDGETS: Record<string, number> = {
  '/api/public/layout': LAYOUT,
  '/api/public/portfolio': 1,
  '/api/public/pricing': 1,
  '/api/public/articles': 1,
  '/api/public/categories': 1,
  '/api/public/services': 1,
  '/api/public/forms/contact': 1,
  '/api/public/forms/quotation': 1,
}

const PAGE_BUDGETS: [RegExp, number][] = [
  [/^\/$/, PAGE_BASE + 1 + 6],
  [/^\/services\/[^/]+$/, PAGE_BASE + 4],
  [/^\/services$/, PAGE_BASE + 1],
  [/^\/articles$/, PAGE_BASE + 2],
  [/^\/articles\/category\/[^/]+$/, PAGE_BASE + 3],
  [/^\/article\/[^/]+$/, PAGE_BASE + 2],
  [/^\/(pricing|portfolio|contact|quote)$/, PAGE_BASE + 1],
  [/^\/[^/]+$/, PAGE_BASE + 1 + 3],
]

async function measure(request: import('@playwright/test').APIRequestContext, path: string) {
  const response = await request.get(path, { headers: { 'x-db-cold': '1', 'x-real-ip': uniqueIp() } })
  expect(response.status(), path).toBe(200)
  const count = response.headers()['x-db-queries']
  expect(count, `${path} has no x-db-queries header; start the server with NUXT_DB_QUERY_LOG=true`).toBeDefined()
  return { count: Number(count), log: response.headers()['x-db-query-log'] ?? '' }
}

test('public API endpoints stay within their query budget', async ({ request }) => {
  for (const [path, budget] of Object.entries(API_BUDGETS)) {
    const { count, log } = await measure(request, path)
    expect(count, `${path}: ${log}`).toBeLessThanOrEqual(budget)
  }
})

test('every page in the sitemap stays within its query budget', async ({ request }) => {
  test.setTimeout(120_000)
  const xml = await (await request.get('/sitemap.xml')).text()
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]!).pathname)
  expect(paths.length).toBeGreaterThan(5)

  for (const path of paths) {
    const budget = PAGE_BUDGETS.find(([pattern]) => pattern.test(path))?.[1]
    expect(budget, `no budget for ${path}`).toBeDefined()
    const { count, log } = await measure(request, path)
    expect(count, `${path}: ${log}`).toBeLessThanOrEqual(budget!)
  }
})
