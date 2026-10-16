<script setup lang="ts">
const { settings, services } = useSiteSettings()

const hours = computed(() => summarizeWorkHours(settings.value?.workHours ?? []))
const year = new Date().getFullYear()

const companyLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Articles', to: '/articles' },
  { label: 'Contact', to: '/contact' },
]
</script>

<template>
  <footer class="border-t border-default bg-muted/40 [contain-intrinsic-size:auto_480px] [content-visibility:auto]">
    <AppContainer class="grid gap-10 py-14 md:grid-cols-12">
      <div class="space-y-4 md:col-span-4">
        <AppLogo />
        <p
          v-if="settings?.tagline"
          class="max-w-xs text-sm text-muted"
        >
          {{ settings.tagline }}
        </p>
        <ul
          v-if="settings?.socialLinks.length"
          class="flex flex-wrap gap-1"
          aria-label="Social media"
        >
          <li
            v-for="link in settings.socialLinks"
            :key="link.id"
          >
            <BaseButton
              :to="link.url"
              target="_blank"
              rel="noopener noreferrer"
              :icon="link.icon"
              :aria-label="link.label"
              color="neutral"
              variant="ghost"
            />
          </li>
        </ul>
      </div>

      <nav
        class="space-y-3 md:col-span-2"
        aria-label="Services"
      >
        <p class="text-sm font-semibold text-highlighted">
          Services
        </p>
        <ul class="space-y-2 text-sm">
          <li
            v-for="service in services"
            :key="service.slug"
          >
            <NuxtLink
              :to="`/service/${service.slug}`"
              class="text-muted hover:text-default"
            >
              {{ service.name }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <nav
        class="space-y-3 md:col-span-2"
        aria-label="Company"
      >
        <p class="text-sm font-semibold text-highlighted">
          Company
        </p>
        <ul class="space-y-2 text-sm">
          <li
            v-for="link in companyLinks"
            :key="link.to"
          >
            <NuxtLink
              :to="link.to"
              class="text-muted hover:text-default"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <address class="space-y-3 text-sm not-italic md:col-span-4">
        <p class="font-semibold text-highlighted">
          Contact
        </p>
        <p
          v-if="settings?.address"
          class="text-muted"
        >
          {{ settings.address }}
        </p>
        <p v-if="settings?.email">
          <NuxtLink
            :to="`mailto:${settings.email}`"
            class="text-muted hover:text-default"
          >
            {{ settings.email }}
          </NuxtLink>
        </p>
        <p v-if="settings?.phone">
          <NuxtLink
            :to="`tel:${settings.phone.replace(/[^+\d]/g, '')}`"
            class="text-muted hover:text-default"
          >
            {{ settings.phone }}
          </NuxtLink>
        </p>
        <dl
          v-if="hours.length"
          class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pt-1 text-muted"
        >
          <template
            v-for="line in hours"
            :key="line.days"
          >
            <dt>{{ line.days }}</dt>
            <dd class="tabular-nums">
              {{ line.hours }}
            </dd>
          </template>
        </dl>
      </address>
    </AppContainer>

    <AppContainer class="border-t border-default py-6 text-center text-xs text-muted">
      <p>© {{ year }} {{ settings?.siteName }}. All rights reserved.</p>
    </AppContainer>
  </footer>
</template>
