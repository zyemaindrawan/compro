<script setup lang="ts">
const { services } = useSiteSettings()
const route = useRoute()
const menuOpen = ref(false)

const links = [
  { label: 'Pricing', to: '/pricing' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Articles', to: '/articles', match: /^\/article/ },
  { label: 'Contact', to: '/contact' },
]

const isActive = (to: string, match?: RegExp) => (match ?? new RegExp(`^${to}`)).test(route.path)

watch(() => route.fullPath, () => {
  menuOpen.value = false
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default/60 bg-default/90 backdrop-blur">
    <UContainer class="flex h-(--ui-header-height) items-center justify-between gap-6">
      <AppLogo />

      <nav
        aria-label="Main"
        class="hidden lg:block"
      >
        <ul class="flex items-center gap-1 text-sm">
          <li class="group relative">
            <NuxtLink
              to="/services"
              class="flex items-center gap-1 rounded-md px-3 py-2 transition-colors hover:text-highlighted"
              :class="isActive('/services') ? 'text-primary' : 'text-muted'"
              aria-haspopup="true"
            >
              Services
              <UIcon
                name="i-lucide-chevron-down"
                class="size-4 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180"
              />
            </NuxtLink>
            <div class="invisible absolute top-full left-0 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul class="w-64 rounded-lg border border-default bg-default p-1.5 shadow-lg shadow-black/5">
                <li
                  v-for="service in services"
                  :key="service.slug"
                >
                  <NuxtLink
                    :to="`/services/${service.slug}`"
                    class="block rounded-md px-3 py-2 text-default transition-colors hover:bg-elevated"
                  >
                    {{ service.name }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </li>
          <li
            v-for="link in links"
            :key="link.to"
          >
            <NuxtLink
              :to="link.to"
              class="block rounded-md px-3 py-2 transition-colors hover:text-highlighted"
              :class="isActive(link.to, link.match) ? 'text-primary' : 'text-muted'"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-1.5">
        <ThemeToggle />
        <UButton
          to="/quote"
          label="Get a quote"
          class="hidden sm:inline-flex"
        />
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          aria-label="Open menu"
          class="lg:hidden"
          @click="menuOpen = true"
        />
      </div>
    </UContainer>

    <USlideover
      v-model:open="menuOpen"
      title="Menu"
      side="right"
      :ui="{ content: 'max-w-xs' }"
    >
      <template #body>
        <nav aria-label="Mobile">
          <ul class="space-y-1">
            <li>
              <NuxtLink
                to="/services"
                class="block rounded-md px-2 py-2 font-medium text-highlighted"
              >
                Services
              </NuxtLink>
              <ul class="ms-2 border-s border-default ps-3">
                <li
                  v-for="service in services"
                  :key="service.slug"
                >
                  <NuxtLink
                    :to="`/services/${service.slug}`"
                    class="block py-1.5 text-sm text-muted hover:text-default"
                  >
                    {{ service.name }}
                  </NuxtLink>
                </li>
              </ul>
            </li>
            <li
              v-for="link in links"
              :key="link.to"
            >
              <NuxtLink
                :to="link.to"
                class="block rounded-md px-2 py-2 font-medium"
                :class="isActive(link.to, link.match) ? 'text-primary' : 'text-highlighted'"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <UButton
          to="/quote"
          label="Get a quote"
          block
          class="mt-6"
        />
      </template>
    </USlideover>
  </header>
</template>
