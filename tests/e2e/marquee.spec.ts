import { png, uploadMedia } from './fixtures/content'
import { expect, test } from './fixtures'

const COLORS = ['#b45309', '#15803d', '#1d4ed8', '#be123c', '#0f766e']

test.describe('client logo marquee', () => {
  const created: { logo: string, media: string }[] = []

  test.beforeAll(async ({ playwright, baseURL }) => {
    const { ADMIN_STATE } = await import('./fixtures/admin')
    const api = await playwright.request.newContext({ baseURL, storageState: ADMIN_STATE, extraHTTPHeaders: { 'x-real-ip': '198.19.0.1' } })
    const logos = await (await api.get('/api/admin/client-logos')).json() as { isActive: boolean }[]
    for (let index = logos.filter(logo => logo.isActive).length; index < 5; index++) {
      const media = await uploadMedia(api, await png(480, 120, COLORS[index]!, `CLIENT ${index}`), `e2e-logo-${index}`, 'logo')
      const list = await (await api.post('/api/admin/client-logos', { data: { name: `E2E Client ${index}`, logo_media_id: media.id, url: '', is_active: true } })).json() as { id: string, name: string }[]
      created.push({ logo: list.find(item => item.name === `E2E Client ${index}`)!.id, media: media.id })
    }
    await api.dispose()
  })

  test.afterAll(async ({ playwright, baseURL }) => {
    const { ADMIN_STATE } = await import('./fixtures/admin')
    const api = await playwright.request.newContext({ baseURL, storageState: ADMIN_STATE, extraHTTPHeaders: { 'x-real-ip': '198.19.0.2' } })
    for (const item of created) {
      await api.delete(`/api/admin/client-logos/${item.logo}`)
      await api.delete(`/api/admin/media/${item.media}`)
    }
    await api.dispose()
  })

  test('scrolls in a loop and pauses on hover', async ({ page }) => {
    await page.goto('/')
    const marquee = page.locator('.marquee').first()
    await marquee.scrollIntoViewIfNeeded()
    const track = marquee.locator('.marquee-track')
    const animation = () => track.evaluate((element) => {
      const style = getComputedStyle(element)
      return { name: style.animationName, state: style.animationPlayState, count: style.animationIterationCount }
    })
    expect(await animation()).toEqual({ name: 'marquee', state: 'running', count: 'infinite' })
    await marquee.hover()
    expect((await animation()).state).toBe('paused')
    await expect(track.locator('ul').nth(1)).toHaveAttribute('aria-hidden', 'true')
  })

  test('stays still for visitors who prefer reduced motion', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const track = page.locator('.marquee-track').first()
    await track.scrollIntoViewIfNeeded()
    expect(await track.evaluate(element => getComputedStyle(element).animationName)).toBe('none')
    await expect(track.locator('ul').nth(1)).toBeHidden()
    await context.close()
  })
})
