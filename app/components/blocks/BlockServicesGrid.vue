<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'services_grid'>, data: BlockData }>()

const services = computed(() => {
  if (!props.block.service_ids.length) return props.data.services
  const byId = new Map(props.data.services.map(service => [service.id, service]))
  return props.block.service_ids.flatMap(id => byId.get(id) ?? [])
})
</script>

<template>
  <section v-if="services.length">
    <AppContainer class="space-y-10 py-16 sm:py-24">
      <SectionHeader
        :heading="block.heading"
        :intro="block.intro"
      />
      <ServiceList
        :services="services"
        :heading-level="block.heading ? 'h3' : 'h2'"
      />
    </AppContainer>
  </section>
</template>
