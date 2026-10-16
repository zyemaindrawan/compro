<script setup lang="ts">
import type { ServiceCard } from '#shared/types/models'

const { data: services } = await useFetch<ServiceCard[]>('/api/public/services', { key: 'public-services', default: () => [] })

usePageSeo({
  title: 'Services',
  description: 'Web development, custom applications, Android apps and cloud infrastructure, delivered by one team.',
})

useSchemaOrg([defineWebPage({ '@type': 'CollectionPage' })])
useItemListSchema(services.value.map(service => ({ name: service.name, url: `/service/${service.slug}` })), { name: 'Services' })
</script>

<template>
  <div>
    <AppContainer class="space-y-12 py-14 sm:py-20">
      <PageHeading
        title="Services"
        description="Four practices, one team. Pick one, or combine them. Most clients start with one project and stay for the next."
      />
      <ServiceList
        :services="services"
        heading-level="h2"
      />
    </AppContainer>
    <BlockCta :block="{ heading: 'Not sure where to start?', body: 'Describe the problem. We will tell you which service fits, or if none does.', primary: { label: 'Request a quote', href: '/quote' } }" />
  </div>
</template>
