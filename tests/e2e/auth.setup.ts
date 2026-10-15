import { expect, test as setup } from '@playwright/test'
import { ADMIN_STATE, readAdmin, saveTotpSecret, totpCode } from './fixtures/admin'

setup('admin signs in with a password and enrolls an authenticator', async ({ page }) => {
  const admin = readAdmin()
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(admin.email)
  await page.getByLabel('Password', { exact: true }).fill(admin.password)
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page.getByRole('heading', { name: 'Set up two-factor authentication' })).toBeVisible()
  const secretField = page.getByRole('textbox', { name: 'Setup key' })
  await expect(secretField).not.toHaveValue('')
  const secret = await secretField.inputValue()
  saveTotpSecret(secret)

  await page.locator('input[autocomplete="one-time-code"]').first().click()
  await page.keyboard.type(totpCode(secret))
  await page.waitForURL(url => url.pathname === '/admin')
  await expect(page.getByText(/Welcome back/)).toBeVisible()
  await page.context().storageState({ path: ADMIN_STATE })
})
