import { expect, test } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { themeAtLoad: string }).themeAtLoad = document.documentElement.className
    })
  })
})

const themeAtLoad = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { themeAtLoad: string }).themeAtLoad)

test('the system preference applies before the page paints', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, colorScheme: 'dark' })
  const page = await context.newPage()
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      (window as unknown as { themeAtLoad: string }).themeAtLoad = document.documentElement.className
    })
  })
  await page.goto('/')
  expect(await themeAtLoad(page)).toContain('dark')
  await context.close()
})

test('the toggle choice persists across visits without a flash', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Toggle dark mode' }).first().click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  expect(await themeAtLoad(page)).toContain('dark')

  await page.getByRole('button', { name: 'Toggle dark mode' }).first().click()
  await page.reload()
  expect(await themeAtLoad(page)).not.toContain('dark')
})
