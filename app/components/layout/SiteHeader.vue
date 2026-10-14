<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { services } = useSiteSettings()
const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Services',
    to: '/services',
    active: route.path.startsWith('/services'),
    children: services.value.map(service => ({ label: service.name, to: `/services/${service.slug}` })),
  },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Articles', to: '/articles', active: route.path.startsWith('/article') },
  { label: 'Contact', to: '/contact' },
])
</script>

<template>
  <UHeader
    mode="slideover"
    :ui="{ root: 'border-b border-default/60 bg-default/85 backdrop-blur', center: 'hidden lg:flex' }"
  >
    <template #title>
      <AppLogo :to="false" />
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
      content-orientation="vertical"
    />

    <template #right>
      <ThemeToggle />
      <UButton
        to="/quote"
        label="Get a quote"
        class="hidden sm:inline-flex"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
      <UButton
        to="/quote"
        label="Get a quote"
        block
        class="mt-6"
      />
    </template>
  </UHeader>
</template>
