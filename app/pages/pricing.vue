<script setup lang="ts">
import type { PricingGroup } from '#shared/types/models'

const route = useRoute()
const { data: groups } = await useFetch<PricingGroup[]>('/api/public/pricing', { key: 'public-pricing', default: () => [] })

usePageSeo({
  title: 'Pricing',
  description: 'Fixed prices for web, custom application, Android and cloud projects. Compare what each plan includes.',
})

useSchemaOrg([defineWebPage()])
</script>

<template>
  <div>
    <AppContainer class="space-y-12 py-14 sm:py-20">
      <div class="max-w-2xl space-y-3">
        <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
          Pricing
        </h1>
        <p class="text-lg text-muted">
          Fixed prices for a defined scope, in Indonesian rupiah. Larger work is quoted after a paid discovery week.
        </p>
      </div>
      <PricingTable
        v-if="groups.length"
        :groups="groups"
        :initial-service="typeof route.query.service === 'string' ? route.query.service : undefined"
      />
      <EmptyState
        v-else
        icon="i-lucide-tags"
        title="Prices are being updated"
        description="Request a quote and we will send current prices."
      />
    </AppContainer>
    <BlockCta :block="{ heading: 'Need something in between?', body: 'Tell us the scope and budget. We will propose a plan that fits.', primary: { label: 'Request a quote', href: '/quote' } }" />
  </div>
</template>
