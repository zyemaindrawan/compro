const siteUrl = process.env.NUXT_SITE_URL || 'http://localhost:3000'
const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const minute = 60_000

export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxtjs/supabase',
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
    name: 'Agency',
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
    smtp: {
      host: '',
      port: 587,
      user: '',
      pass: '',
      from: '',
    },
    turnstile: {
      secretKey: '',
    },
    public: {
      turnstile: {
        siteKey: '',
      },
    },
  },

  routeRules: {
    '/admin/**': { ssr: false, robots: false },
    '/api/**': { robots: false },
    '/api/auth/login': {
      security: { rateLimiter: { tokensPerInterval: 5, interval: minute, headers: true } },
    },
    '/api/auth/mfa/**': {
      security: { rateLimiter: { tokensPerInterval: 5, interval: minute, headers: true } },
    },
    '/api/admin/**': {
      security: { rateLimiter: { tokensPerInterval: 60, interval: minute } },
    },
    '/api/admin/media': {
      security: {
        rateLimiter: { tokensPerInterval: 30, interval: minute },
        requestSizeLimiter: { maxRequestSizeInBytes: 1_000_000, maxUploadFileRequestInBytes: 10_000_000 },
      },
    },
    '/api/public/**': {
      security: {
        rateLimiter: { tokensPerInterval: 120, interval: minute },
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
    compressPublicAssets: { gzip: true, brotli: true },
    storage: {
      cache: { driver: 'lru-cache', max: 500 },
    },
  },

  typescript: {
    strict: true,
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
        'connect-src': ['\'self\'', supabaseUrl, 'https://challenges.cloudflare.com', 'https://*.umami.is', 'https://cloud.umami.is'],
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
    exclude: ['/admin/**'],
  },

  supabase: {
    redirect: false,
    types: '~~/shared/types/database.ts',
    cookieOptions: {
      maxAge: 60 * 60 * 12,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
})
