<script setup lang="ts">
import type { BlockProps, BlockType } from '#shared/schemas/block.schema'
import type { BlockData, PageBlock } from '#shared/types/models'

const props = defineProps<{
  blocks: PageBlock[]
  data: BlockData
}>()

const faqs = computed(() => {
  const groups = props.blocks.flatMap(block => (block.type === 'faq' ? [String(block.props.group ?? '')] : []))
  if (!groups.length) return []
  if (groups.includes('')) return props.data.faqs
  return props.data.faqs.filter(faq => groups.includes(faq.group))
})

if (faqs.value.length) {
  useSchemaOrg([
    defineWebPage({ '@type': ['WebPage', 'FAQPage'] }),
    ...faqs.value.map(faq => defineQuestion({ name: faq.question, acceptedAnswer: faq.answer })),
  ])
}

function blockProps<T extends BlockType>(block: PageBlock, _type: T) {
  return block.props as BlockProps<T>
}
</script>

<template>
  <div>
    <template
      v-for="(block, index) in blocks"
      :key="block.id"
    >
      <LazyBlockHero
        v-if="block.type === 'hero' && index === 0"
        :block="blockProps(block, 'hero')"
        :data="data"
        first
        hydrate-on-interaction
      />
      <LazyBlockHero
        v-else-if="block.type === 'hero'"
        :block="blockProps(block, 'hero')"
        :data="data"
        :first="false"
        hydrate-on-visible
      />
      <LazyBlockRichText
        v-else-if="block.type === 'rich_text'"
        :block="blockProps(block, 'rich_text')"
        hydrate-never
      />
      <LazyBlockImageText
        v-else-if="block.type === 'image_text'"
        :block="blockProps(block, 'image_text')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockServicesGrid
        v-else-if="block.type === 'services_grid'"
        :block="blockProps(block, 'services_grid')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockPricingTable
        v-else-if="block.type === 'pricing_table'"
        :block="blockProps(block, 'pricing_table')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockLatestArticles
        v-else-if="block.type === 'latest_articles'"
        :block="blockProps(block, 'latest_articles')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockStats
        v-else-if="block.type === 'stats'"
        :block="blockProps(block, 'stats')"
        hydrate-on-visible
      />
      <LazyBlockCta
        v-else-if="block.type === 'cta'"
        :block="blockProps(block, 'cta')"
        hydrate-on-visible
      />
      <LazyBlockPortfolioGrid
        v-else-if="block.type === 'portfolio_grid'"
        :block="blockProps(block, 'portfolio_grid')"
        :data="data"
        hydrate-never
      />
      <LazyBlockClientLogos
        v-else-if="block.type === 'client_logos'"
        :block="blockProps(block, 'client_logos')"
        :data="data"
        hydrate-never
      />
      <LazyBlockTestimonials
        v-else-if="block.type === 'testimonials'"
        :block="blockProps(block, 'testimonials')"
        :data="data"
        hydrate-on-visible
      />
      <LazyBlockFaq
        v-else-if="block.type === 'faq'"
        :block="blockProps(block, 'faq')"
        :data="data"
        hydrate-never
      />
      <LazyBlockForm
        v-else-if="block.type === 'form'"
        :block="blockProps(block, 'form')"
        :data="data"
        hydrate-on-visible
      />
    </template>
  </div>
</template>
