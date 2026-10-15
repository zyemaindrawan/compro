<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

await useLayoutData()

const notFound = computed(() => props.error.statusCode === 404)
const unavailable = computed(() => props.error.statusCode === 503)

const heading = computed(() => {
  if (notFound.value) return 'This page does not exist'
  if (unavailable.value) return 'We are doing some maintenance'
  return 'Something broke on our side'
})

const message = computed(() => {
  if (notFound.value) return 'The link may be old, or the page has moved. Try one of these instead.'
  if (unavailable.value) return 'The site will be back shortly. Please try again in a few minutes.'
  return 'The error has been logged. Try again, or reach out if it keeps happening.'
})

useSeoMeta({
  title: () => (notFound.value ? 'Page not found' : 'Error'),
  description: () => message.value,
  ogDescription: () => message.value,
  robots: 'noindex',
})

const { settings } = useSiteSettings()
const isAdmin = computed(() => useRoute().path.startsWith('/admin'))

const links = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Articles', to: '/articles' },
  { label: 'Contact', to: '/contact' },
]
</script>

<template>
  <NuxtLayout :name="isAdmin ? 'auth' : 'default'">
    <AppContainer class="py-24 sm:py-32">
      <div class="max-w-xl space-y-6">
        <p class="font-mono text-sm text-primary">
          {{ error.statusCode }}
        </p>
        <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
          {{ heading }}
        </h1>
        <p class="text-lg text-muted">
          {{ message }}
        </p>
        <div class="flex flex-wrap gap-3">
          <BaseButton
            v-if="!notFound"
            label="Try again"
            icon="i-lucide-rotate-cw"
            @click="clearError({ redirect: useRoute().fullPath })"
          />
          <BaseButton
            :label="isAdmin ? 'Back to dashboard' : 'Back to home'"
            :color="notFound ? 'primary' : 'neutral'"
            :variant="notFound ? 'solid' : 'outline'"
            @click="clearError({ redirect: isAdmin ? '/admin' : '/' })"
          />
        </div>
        <nav
          v-if="notFound && !isAdmin"
          aria-label="Suggested pages"
          class="pt-4"
        >
          <ul class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <li
              v-for="link in links"
              :key="link.to"
            >
              <NuxtLink
                :to="link.to"
                class="text-muted underline-offset-4 hover:text-default hover:underline"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <p
          v-if="!notFound && settings?.email"
          class="text-sm text-muted"
        >
          Contact: <NuxtLink
            :to="`mailto:${settings.email}`"
            class="underline underline-offset-4"
          >{{ settings.email }}</NuxtLink>
        </p>
      </div>
    </AppContainer>
  </NuxtLayout>
</template>
