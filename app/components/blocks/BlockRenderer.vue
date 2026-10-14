<script setup lang="ts">
import type { BlockProps, BlockType } from '#shared/schemas/block.schema'
import type { BlockData, PageBlock } from '#shared/types/models'

defineProps<{
  blocks: PageBlock[]
  data: BlockData
}>()

function props<T extends BlockType>(block: PageBlock, _type: T) {
  return block.props as BlockProps<T>
}
</script>

<template>
  <div>
    <template
      v-for="(block, index) in blocks"
      :key="block.id"
    >
      <BlockHero
        v-if="block.type === 'hero' && index === 0"
        :block="props(block, 'hero')"
        :data="data"
        first
      />
      <LazyBlockHero
        v-else-if="block.type === 'hero'"
        :block="props(block, 'hero')"
        :data="data"
        :first="false"
        hydrate-on-visible
      />
      <LazyBlockRichText
        v-else-if="block.type === 'rich_text'"
        :block="props(block, 'rich_text')"
        hydrate-never
      />
      <LazyBlockImageText
        v-else-if="block.type === 'image_text'"
        :block="props(block, 'image_text')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockServicesGrid
        v-else-if="block.type === 'services_grid'"
        :block="props(block, 'services_grid')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockPricingTable
        v-else-if="block.type === 'pricing_table'"
        :block="props(block, 'pricing_table')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockLatestArticles
        v-else-if="block.type === 'latest_articles'"
        :block="props(block, 'latest_articles')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockStats
        v-else-if="block.type === 'stats'"
        :block="props(block, 'stats')"
        hydrate-on-visible
      />
      <LazyBlockCta
        v-else-if="block.type === 'cta'"
        :block="props(block, 'cta')"
        hydrate-on-visible
      />
    </template>
  </div>
</template>
