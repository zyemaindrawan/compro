import { expect, test } from './fixtures'

test('the health endpoint reports the database and is never cached', async ({ anonApi }) => {
  const response = await anonApi.get('/api/health')
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('no-store')
  const body = await response.json() as { status: string, database: boolean, buildId: string, uptimeSeconds: number }
  expect(body).toMatchObject({ status: 'ok', database: true })
  expect(body.buildId).toBeTruthy()
})
