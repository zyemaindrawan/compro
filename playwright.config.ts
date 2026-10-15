import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

if (existsSync('.env')) process.loadEnvFile('.env')

const PORT = 3100
const baseURL = `http://localhost:${PORT}`
const TURNSTILE_MOCK = 'http://127.0.0.1:3199'
const executablePath = process.env.PW_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  webServer: [
    {
      command: 'node tests/e2e/mocks/turnstile-server.mjs',
      url: `${TURNSTILE_MOCK}/health`,
      reuseExistingServer: true,
    },
    {
      command: 'node .output/server/index.mjs',
      url: `${baseURL}/robots.txt`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        ...process.env as Record<string, string>,
        PORT: String(PORT),
        NUXT_SITE_URL: baseURL,
        NUXT_TURNSTILE_VERIFY_URL: `${TURNSTILE_MOCK}/siteverify`,
        NUXT_TURNSTILE_SECRET_KEY: 'e2e-secret',
        NUXT_PUBLIC_TURNSTILE_SITE_KEY: 'e2e-site-key',
        NUXT_IP_HASH_SALT: 'e2e-ip-hash-salt-value',
        NUXT_TRUST_PROXY: 'x-real-ip',
        NUXT_DB_QUERY_LOG: 'true',
      },
    },
  ],
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      dependencies: ['setup'],
      testIgnore: /\.mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
    },
    {
      name: 'mobile',
      dependencies: ['setup'],
      testMatch: /\.mobile\.spec\.ts/,
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 }, launchOptions: { executablePath } },
    },
  ],
})
