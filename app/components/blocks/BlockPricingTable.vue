<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'pricing_table'>, data: BlockData }>()

const groups = computed(() => {
  const withPlans = props.data.pricing.filter(group => group.plans.length)
  return props.block.service_id ? withPlans.filter(group => group.service.id === props.block.service_id) : withPlans
})
</script>

<template>
  <section
    v-if="groups.length"
    class="border-y border-default bg-muted/40"
  >
    <AppContainer class="space-y-10 py-16 sm:py-24">
      <SectionHeader
        :heading="block.heading"
        :intro="block.intro"
      />
      <PricingTable :groups="groups" />
    </AppContainer>
  </section>
</template>
