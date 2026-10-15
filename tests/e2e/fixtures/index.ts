import { test as base, expect, type APIRequestContext } from '@playwright/test'
import { ADMIN_STATE } from './admin'

const TURNSTILE_STUB = `window.turnstile = {
  render(element, options) { setTimeout(() => options.callback('e2e-token'), 50); return 'e2e-widget' },
  reset() {},
  remove() {},
}`

let counter = 0
export function uniqueIp() {
  counter += 1
  return `198.18.${Math.floor(Math.random() * 200) + 1}.${(counter % 250) + 1}`
}

interface Fixtures {
  turnstile: undefined
  adminApi: APIRequestContext
  anonApi: APIRequestContext
}

export const test = base.extend<Fixtures>({
  turnstile: [async ({ context }, use) => {
    await context.route('https://challenges.cloudflare.com/**', route => route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }))
    await use()
  }, { auto: true }],

  adminApi: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL, storageState: ADMIN_STATE, extraHTTPHeaders: { 'x-real-ip': uniqueIp() } })
    await use(api)
    await api.dispose()
  },

  anonApi: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { 'x-real-ip': uniqueIp() } })
    await use(api)
    await api.dispose()
  },
})

export { expect }
