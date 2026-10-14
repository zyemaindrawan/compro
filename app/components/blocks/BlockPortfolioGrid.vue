<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'portfolio_grid'>, data: BlockData }>()

const items = computed(() => props.data.portfolio[`${props.block.service_id ?? 'all'}:${props.block.limit}`] ?? [])
</script>

<template>
  <section v-if="items.length">
    <UContainer class="space-y-10 py-16 sm:py-24">
      <SectionHeader :heading="block.heading">
        <template #actions>
          <UButton
            to="/portfolio"
            label="All work"
            trailing-icon="i-lucide-arrow-right"
            color="neutral"
            variant="link"
            class="px-0"
          />
        </template>
      </SectionHeader>
      <PortfolioGrid
        :items="items"
        :heading-level="block.heading ? 'h3' : 'h2'"
      />
    </UContainer>
  </section>
</template>
