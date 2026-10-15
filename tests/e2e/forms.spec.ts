import type { APIRequestContext } from '@playwright/test'
import { expect, test, uniqueIp } from './fixtures'

const contact = (email: string) => ({
  name: 'Sari Wulandari',
  email,
  company: 'Gudang Nusantara',
  message: 'We need stock tracking for two warehouses before March.',
})

async function submissionsFor(adminApi: APIRequestContext, email: string, status: string) {
  const response = await adminApi.get('/api/admin/submissions', { params: { status, q: email } })
  return (await response.json() as { items: { id: string, status: string }[] }).items
}

async function cleanup(adminApi: APIRequestContext, email: string) {
  const ids = [...await submissionsFor(adminApi, email, 'all'), ...await submissionsFor(adminApi, email, 'spam')].map(item => item.id)
  if (ids.length) await adminApi.delete('/api/admin/submissions', { data: { ids } })
}

test('a submission without a Turnstile token is rejected', async ({ anonApi }) => {
  const response = await anonApi.post('/api/public/submissions/contact', {
    data: { values: contact('no-token@example.test'), sourcePath: '/contact' },
  })
  expect(response.status()).toBe(422)
  expect((await response.json() as { data: { fields: Record<string, string> } }).data.fields.turnstile).toBeTruthy()
})

test('a filled honeypot is stored as spam and answered like a success', async ({ playwright, baseURL, adminApi }) => {
  const email = `honeypot-${Date.now()}@example.test`
  const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { 'x-real-ip': uniqueIp() } })
  try {
    const response = await api.post('/api/public/submissions/contact', {
      data: { values: contact(email), turnstileToken: 'e2e-token', website: 'https://spam.example', sourcePath: '/contact' },
    })
    expect(response.status()).toBe(200)
    expect(await submissionsFor(adminApi, email, 'spam')).toHaveLength(1)
    expect(await submissionsFor(adminApi, email, 'all')).toHaveLength(0)
  }
  finally {
    await api.dispose()
    await cleanup(adminApi, email)
  }
})

test('a valid contact form submission reaches the inbox', async ({ page, adminApi }) => {
  const email = `contact-${Date.now()}@example.test`
  try {
    await page.goto('/contact')
    const form = page.locator('form')
    await form.scrollIntoViewIfNeeded()
    await page.getByLabel('Name').fill('Sari Wulandari')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Message').fill('We need stock tracking for two warehouses before March.')
    await page.waitForTimeout(3200)
    await page.getByRole('button', { name: 'Send message' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Thanks' })).toBeVisible()

    const items = await submissionsFor(adminApi, email, 'new')
    expect(items).toHaveLength(1)
  }
  finally {
    await cleanup(adminApi, email)
  }
})

test('the quote form shows the plan picked on the pricing page', async ({ page }) => {
  await page.goto('/pricing')
  const cta = page.locator('a[href*="/quote?"][href*="plan="]').first()
  const href = await cta.getAttribute('href')
  await page.goto(href!)
  await expect(page.getByText('You picked')).toBeVisible()
  const service = new URL(href!, 'http://x').searchParams.get('service')
  await expect(page.locator('select[name="service"]')).toHaveValue(service!)
})
