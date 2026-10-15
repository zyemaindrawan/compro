const isProductionBuild = process.env.NODE_ENV === 'production' && process.argv.includes('build')
const missingBuildEnv = ['NUXT_SITE_URL', 'NUXT_SUPABASE_URL'].filter(name => !process.env[name])
if (isProductionBuild && missingBuildEnv.length) {
  throw new Error(`Set ${missingBuildEnv.join(' and ')} before building: they are baked into the CSP, image domains and site URL.`)
}

const siteUrl = process.env.NUXT_SITE_URL || 'http://localhost:3000'
const supabaseUrl = process.env.NUXT_SUPABASE_URL || 'http://127.0.0.1:54321'
const minute = 60_000

function limit(tokensPerInterval: number, headers = false) {
  return { tokensPerInterval, interval: minute, headers, ipHeader: 'x-compro-client-ip' }
}

export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxtjs/seo',
    '@vueuse/nuxt',
    'nuxt-security',
  ],

  components: [{ path: '~/components', pathPrefix: false }],

  devtools: { enabled: false },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'alternate', type: 'application/rss+xml', title: 'Articles', href: '/rss.xml' }],
    },
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: siteUrl,
    name: 'TokoDesign',
    defaultLocale: 'en',
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    storageKey: 'color-mode',
  },

  ui: {
    fonts: false,
    colorMode: true,
    theme: {
      colors: ['primary', 'neutral', 'success', 'warning', 'error', 'info'],
    },
  },

  runtimeConfig: {
    ipHashSalt: '',
    trustProxy: '',
    dbQueryLog: false,
    supabase: {
      url: supabaseUrl,
      key: '',
      secretKey: '',
    },
    smtp: {
      host: '',
      port: 587,
      user: '',
      pass: '',
      from: '',
    },
    turnstile: {
      secretKey: '',
      verifyUrl: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    },
    public: {
      mediaOrigin: new URL(supabaseUrl).origin,
      turnstile: {
        siteKey: '',
      },
    },
  },

  routeRules: {
    '/admin/**': { ssr: false, robots: false },
    '/api/**': { robots: false },
    '/api/auth/login': {
      security: { rateLimiter: limit(5, true) },
    },
    '/api/auth/mfa/**': {
      security: { rateLimiter: limit(5, true) },
    },
    '/api/admin/**': {
      security: { rateLimiter: limit(60) },
    },
    '/api/health': {
      security: { rateLimiter: limit(30) },
    },
    '/api/public/submissions/**': {
      security: {
        rateLimiter: limit(3, true),
        xssValidator: false,
        requestSizeLimiter: { maxRequestSizeInBytes: 64_000 },
      },
    },
    '/api/admin/media': {
      security: {
        rateLimiter: limit(30),
        requestSizeLimiter: { maxRequestSizeInBytes: 1_000_000, maxUploadFileRequestInBytes: 10_000_000 },
      },
    },
    '/api/public/**': {
      security: {
        rateLimiter: limit(120),
        xssValidator: { methods: ['GET', 'POST'] },
      },
    },
  },

  experimental: {
    viewTransition: true,
    typedPages: true,
  },
  compatibilityDate: '2026-10-01',

  nitro: {
    preset: 'node-server',
    experimental: { asyncContext: true },
    compressPublicAssets: { gzip: true, brotli: true },
    storage: {
      cache: { driver: 'lru-cache', max: 500 },
    },
  },

  typescript: {
    strict: true,
  },

  hooks: {
    'build:manifest': (manifest) => {
      for (const chunk of Object.values(manifest)) chunk.prefetch = false
    },
  },

  aiReady: {
    enabled: false,
  },

  eslint: {
    config: {
      stylistic: {
        quotes: 'single',
        semi: false,
        commaDangle: 'always-multiline',
      },
    },
  },

  icon: {
    serverBundle: 'local',
    clientBundle: {
      scan: true,
      sizeLimitKb: 256,
    },
  },

  image: {
    domains: [new URL(supabaseUrl).host],
    format: ['webp'],
  },

  linkChecker: {
    enabled: false,
  },

  ogImage: {
    enabled: false,
  },

  robots: {
    disallow: ['/admin', '/api/admin', '/api/auth'],
  },

  security: {
    nonce: true,
    rateLimiter: false,
    xssValidator: false,
    requestSizeLimiter: {
      maxRequestSizeInBytes: 1_000_000,
      maxUploadFileRequestInBytes: 10_000_000,
    },
    headers: {
      crossOriginEmbedderPolicy: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
      xFrameOptions: 'DENY',
      contentSecurityPolicy: {
        'default-src': ['\'self\''],
        'base-uri': ['\'none\''],
        'object-src': ['\'none\''],
        'frame-ancestors': ['\'none\''],
        'form-action': ['\'self\''],
        'script-src': ['\'self\'', '\'strict-dynamic\'', '\'nonce-{{nonce}}\''],
        'script-src-attr': ['\'none\''],
        'style-src': ['\'self\'', '\'unsafe-inline\''],
        'img-src': ['\'self\'', 'data:', 'blob:', supabaseUrl],
        'font-src': ['\'self\'', 'data:'],
        'connect-src': ['\'self\'', 'https://challenges.cloudflare.com', 'https://*.umami.is', 'https://cloud.umami.is'],
        'frame-src': ['https://challenges.cloudflare.com', 'https://www.youtube-nocookie.com'],
        'worker-src': ['\'self\'', 'blob:'],
        'upgrade-insecure-requests': process.env.NODE_ENV === 'production',
      },
      permissionsPolicy: {
        'camera': [],
        'microphone': [],
        'geolocation': [],
        'display-capture': [],
      },
    },
  },

  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin/**'],
  },
})
