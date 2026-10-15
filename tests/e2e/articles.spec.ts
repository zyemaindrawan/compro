import { articlePayload, createArticle, deleteArticles, e2eSlug } from './fixtures/content'
import { expect, test } from './fixtures'
import { ADMIN_STATE } from './fixtures/admin'

test('published articles appear in the archive and on their own page', async ({ page, adminApi }) => {
  const slug = e2eSlug('archive')
  const title = `E2E archive ${slug}`
  const id = await createArticle(adminApi, articlePayload(title, slug))
  try {
    await page.goto('/articles')
    await page.getByRole('link', { name: title }).first().click()
    await expect(page).toHaveURL(new RegExp(`/article/${slug}$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  }
  finally {
    await deleteArticles(adminApi, [id])
  }
})

test('changing a slug redirects the old URL with a 301', async ({ adminApi, request }) => {
  const oldSlug = e2eSlug('old')
  const newSlug = `${oldSlug}-renamed`
  const id = await createArticle(adminApi, articlePayload('E2E slug change', oldSlug))
  try {
    const update = await adminApi.put(`/api/admin/articles/${id}`, { data: articlePayload('E2E slug change', newSlug) })
    expect(update.status()).toBe(200)

    const response = await request.get(`/article/${oldSlug}`, { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers().location).toBe(`/article/${newSlug}`)
  }
  finally {
    await deleteArticles(adminApi, [id])
    const rules = await (await adminApi.get(`/api/admin/redirects?q=${oldSlug}`)).json() as { items: { id: string }[] }
    for (const rule of rules.items) await adminApi.delete(`/api/admin/redirects/${rule.id}`)
  }
})

test.describe('redirects admin', () => {
  test.use({ storageState: ADMIN_STATE })

  test('admins add, use and delete a redirect', async ({ page, request }) => {
    const from = `/${e2eSlug('legacy')}.html`
    await page.goto('/admin/redirects')
    await page.getByRole('button', { name: 'Add redirect' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Old path').fill(from)
    await dialog.getByLabel('Target').fill('/pricing')
    await dialog.getByRole('button', { name: 'Add redirect' }).click()
    await expect(page.getByRole('button', { name: from, exact: true })).toBeVisible()

    const response = await request.get(from, { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers().location).toBe('/pricing')

    await page.getByRole('button', { name: `Actions for ${from}` }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete redirect' }).click()
    await expect(page.getByRole('button', { name: from, exact: true })).toHaveCount(0)
    expect((await request.get(from, { maxRedirects: 0 })).status()).toBe(404)
  })
})
