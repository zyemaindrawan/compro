import { articlePayload, createArticle, deleteArticles, e2eSlug } from './fixtures/content'
import { expect, test } from './fixtures'

test('prices use IDR with thousands separators', async ({ page }) => {
  await page.goto('/pricing')
  await expect(page.getByText(/IDR \d{1,3}(,\d{3})+/).first()).toBeVisible()
})

test('dates use the site timezone and render the same on server and client', async ({ page, adminApi }) => {
  const messages: string[] = []
  page.on('console', message => messages.push(message.text()))
  const slug = e2eSlug('format')
  const id = await createArticle(adminApi, articlePayload('E2E date format check', slug, '2026-10-14T15:57:00.000Z'))
  try {
    await page.goto(`/article/${slug}`)
    await expect(page.locator('main time').first()).toHaveText('Wed, 14 Oct 2026')
    await page.waitForLoadState('networkidle')
    expect(messages.filter(message => /hydration/i.test(message))).toEqual([])
  }
  finally {
    await deleteArticles(adminApi, [id])
  }
})
