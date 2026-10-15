import { ADMIN_STATE } from './fixtures/admin'
import { expect, test } from './fixtures'

const ADMIN_ROUTES = [
  '/admin', '/admin/submissions', '/admin/articles', '/admin/articles/new', '/admin/categories',
  '/admin/pages', '/admin/services', '/admin/pricing', '/admin/portfolio', '/admin/clients',
  '/admin/testimonials', '/admin/faqs', '/admin/forms', '/admin/media', '/admin/settings',
  '/admin/redirects', '/admin/account',
]

const PUBLIC_ROUTES = ['/', '/services', '/services/web-development', '/pricing', '/portfolio', '/articles', '/contact', '/quote', '/about']

const overflow = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const width = document.documentElement.clientWidth
  const panels = [...document.querySelectorAll<HTMLElement>('[data-slot="body"]')].filter(panel => panel.offsetParent !== null)
  return Math.max(document.documentElement.scrollWidth - width, ...panels.map(panel => panel.scrollWidth - panel.clientWidth))
})

test.describe('admin at 360 px', () => {
  test.use({ storageState: ADMIN_STATE })

  for (const route of ADMIN_ROUTES) {
    test(`${route} fits the screen`, async ({ page }) => {
      await page.goto(route)
      await expect(page.locator('[data-slot="body"]').filter({ visible: true }).first()).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(await overflow(page)).toBeLessThanOrEqual(1)
    })
  }

  test('the sidebar opens from the navbar', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('button', { name: /open|menu|sidebar/i }).first().click()
    await expect(page.getByRole('link', { name: 'Submissions' })).toBeVisible()
  })
})

test.describe('public pages at 360 px', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} fits the screen`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
    })
  }

  test('the mobile menu opens and closes with Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('link', { name: 'Pricing' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
