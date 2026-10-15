import { expect, test } from './fixtures'

test('pricing tabs switch services on the first click', async ({ page }) => {
  await page.goto('/pricing')
  const tabs = page.getByRole('tab')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true')
  await tabs.nth(1).click()
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'false')
})
