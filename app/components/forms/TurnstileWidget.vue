<script setup lang="ts">
interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const TEST_SITE_KEY = '1x00000000000000000000AA'

let scriptPromise: Promise<TurnstileApi> | undefined

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')))
    script.onerror = () => {
      scriptPromise = undefined
      script.remove()
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

const token = defineModel<string>({ default: '' })
const config = useRuntimeConfig()
const siteKey = config.public.turnstile.siteKey || (import.meta.dev ? TEST_SITE_KEY : '')
const container = useTemplateRef<HTMLElement>('container')
const failed = ref(false)
let widgetId: string | undefined

onMounted(async () => {
  if (!siteKey || !container.value) {
    failed.value = true
    return
  }
  try {
    const turnstile = await loadTurnstile()
    widgetId = turnstile.render(container.value, {
      'sitekey': siteKey,
      'theme': 'auto',
      'size': 'flexible',
      'language': 'en',
      'callback': (value: string) => {
        token.value = value
      },
      'expired-callback': () => {
        token.value = ''
      },
      'error-callback': () => {
        token.value = ''
      },
    })
  }
  catch {
    failed.value = true
  }
})

onBeforeUnmount(() => {
  if (widgetId) window.turnstile?.remove(widgetId)
})

defineExpose({
  reset() {
    token.value = ''
    if (widgetId) window.turnstile?.reset(widgetId)
  },
})
</script>

<template>
  <div>
    <div
      ref="container"
      class="min-h-[65px]"
    />
    <p
      v-if="failed"
      class="text-sm text-error"
      role="alert"
    >
      The spam check could not load. Allow challenges.cloudflare.com or email us directly.
    </p>
  </div>
</template>
