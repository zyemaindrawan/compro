import { auditSite } from '../../scripts/seo-audit.mjs'
import { expect, test } from './fixtures'

test('every page in the sitemap has unique metadata and valid structured data', async ({ baseURL }) => {
  test.setTimeout(120_000)
  const report = await auditSite(baseURL!)
  expect(report.pages.length).toBeGreaterThan(5)
  expect(report.errors).toEqual([])
})

test('robots.txt keeps admin and API routes out of search', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toMatch(/Disallow: \/admin/)
  expect(robots).toMatch(/Disallow: \/api\/admin/)
  expect(robots).toMatch(/Sitemap: .*sitemap\.xml/)
})
