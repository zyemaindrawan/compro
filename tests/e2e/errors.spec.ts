import { expect, test } from './fixtures'

const STACK = /\.(mjs|ts|js):\d+|at [\w$.]+ \(|node_modules/

test('a missing page returns 404 with site navigation and no stack trace', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist')
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  expect(await page.locator('body').innerText()).not.toMatch(STACK)
})

test('a server error renders the error page with navigation and no stack trace', async ({ page }) => {
  await page.goto('/')
  await page.route('**/api/public/pages/about**', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ statusCode: 500, message: 'boom', stack: ['at secret (/srv/app/server.mjs:1:1)'] }),
  }))
  await page.getByRole('contentinfo').getByRole('link', { name: 'About' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Something broke on our side')
  await expect(page.getByText('500', { exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  expect(await page.locator('body').innerText()).not.toMatch(STACK)
})
