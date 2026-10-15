<script setup lang="ts">
import type { BlockData, ServicePageData } from '#shared/types/models'

const route = useRoute('services-slug')
const { data, error } = await useFetch<ServicePageData>(() => `/api/public/services/${route.params.slug}`)
if (error.value || !data.value) throw pageError(error.value, 'Service not found')

const previewId = computed(() => (typeof route.query.preview === 'string' ? route.query.preview : null))
const { data: preview } = await useFetch(() => `/api/admin/pages/${previewId.value}/preview`, { immediate: Boolean(previewId.value) })
const page = computed(() => (previewId.value ? preview.value : data.value?.page) ?? null)

const service = computed(() => data.value!.service)
const fallbackData = computed<BlockData>(() => emptyBlockData({ pricing: data.value?.pricing ? [data.value.pricing] : [] }))

useBlockPageSeo(page, {
  previewing: Boolean(previewId.value),
  fallbackTitle: service.value.name,
  fallbackDescription: service.value.summary,
})

useSchemaOrg([
  defineWebPage(),
  {
    '@type': 'Service',
    'name': service.value.name,
    'description': service.value.summary,
    'serviceType': service.value.name,
    'provider': { '@id': '#identity' },
  },
  defineBreadcrumb({
    itemListElement: [
      { name: 'Services', item: '/services' },
      { name: service.value.name, item: `/services/${service.value.slug}` },
    ],
  }),
])
</script>

<template>
  <div>
    <PreviewBanner v-if="previewId" />
    <BlockRenderer
      v-if="page"
      :blocks="page.blocks"
      :data="page.data"
    />
    <template v-else>
      <BlockHero
        :block="{ eyebrow: 'Services', heading: service.name, subheading: service.summary, primary: { label: 'Get a quote', href: '/quote' }, secondary: { label: '', href: '' }, media_id: null }"
        :data="fallbackData"
        first
      />
      <BlockPricingTable
        :block="{ heading: 'Pricing', intro: '', service_id: service.id }"
        :data="fallbackData"
      />
    </template>
  </div>
</template>
