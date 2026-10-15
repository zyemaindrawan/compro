import { expect, test, uniqueIp } from './fixtures'

test('login is throttled per client and spoofed forwarding headers do not reset it', async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL })
  const ip = uniqueIp()
  const statuses: number[] = []
  for (let attempt = 0; attempt < 7; attempt++) {
    const response = await api.post('/api/auth/login', {
      headers: { 'x-real-ip': ip, 'x-forwarded-for': `9.9.9.${attempt}`, 'x-compro-client-ip': `8.8.8.${attempt}` },
      data: { email: 'nobody@example.test', password: 'wrong-password-1' },
    })
    statuses.push(response.status())
  }
  expect(statuses.slice(0, 5).every(status => status !== 429)).toBe(true)
  expect(statuses.at(-1)).toBe(429)

  const otherClient = await api.post('/api/auth/login', {
    headers: { 'x-real-ip': uniqueIp() },
    data: { email: 'nobody@example.test', password: 'wrong-password-1' },
  })
  expect(otherClient.status()).not.toBe(429)
  await api.dispose()
})
