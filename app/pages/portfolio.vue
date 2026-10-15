<script setup lang="ts">
import type { PortfolioPageData } from '#shared/types/models'

const route = useRoute()
const router = useRouter()
const { data } = await useFetch<PortfolioPageData>('/api/public/portfolio', {
  key: 'public-portfolio',
  default: () => ({ items: [], services: [] }),
})

const active = computed(() => {
  const value = route.query.service
  return typeof value === 'string' && data.value.services.some(service => service.slug === value) ? value : ''
})

const items = computed(() => (active.value ? data.value.items.filter(item => item.service?.slug === active.value) : data.value.items))

function select(slug: string) {
  router.replace({ query: slug ? { service: slug } : {} })
}

usePageSeo({
  title: 'Portfolio',
  description: 'Websites, custom applications, Android apps and cloud work we have shipped for clients.',
})

useSchemaOrg([defineWebPage({ '@type': 'CollectionPage' })])
useItemListSchema(data.value.items.map(item => ({ name: item.title, url: item.externalUrl })), { name: 'Portfolio' })
</script>

<template>
  <div>
    <AppContainer class="space-y-10 py-14 sm:py-20">
      <div class="max-w-2xl space-y-3">
        <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
          Portfolio
        </h1>
        <p class="text-lg text-pretty text-muted">
          A selection of shipped work. Each project opens the live site or store listing.
        </p>
      </div>

      <nav
        v-if="data.services.length > 1"
        aria-label="Filter by service"
        class="-mx-4 overflow-x-auto px-4"
      >
        <ul class="flex gap-2">
          <li>
            <BaseButton
              label="All"
              size="sm"
              :color="active ? 'neutral' : 'primary'"
              :variant="active ? 'outline' : 'solid'"
              :aria-pressed="!active"
              @click="select('')"
            />
          </li>
          <li
            v-for="service in data.services"
            :key="service.id"
          >
            <BaseButton
              :label="service.name"
              size="sm"
              :color="active === service.slug ? 'primary' : 'neutral'"
              :variant="active === service.slug ? 'solid' : 'outline'"
              :aria-pressed="active === service.slug"
              class="whitespace-nowrap"
              @click="select(service.slug)"
            />
          </li>
        </ul>
      </nav>

      <PortfolioGrid
        v-if="items.length"
        :items="items"
        heading-level="h2"
        priority-first
      />
      <EmptyState
        v-else
        icon="i-lucide-briefcase"
        title="Projects are being added"
        description="Ask us for case studies relevant to your project."
      />
    </AppContainer>
    <BlockCta :block="{ heading: 'Have a similar project?', body: 'Send the scope and timeline. We reply within two business days with an estimate.', primary: { label: 'Request a quote', href: '/quote' } }" />
  </div>
</template>
