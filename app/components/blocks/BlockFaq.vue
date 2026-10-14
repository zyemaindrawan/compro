<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'faq'>, data: BlockData }>()

const faqs = computed(() => (props.block.group ? props.data.faqs.filter(faq => faq.group === props.block.group) : props.data.faqs))
</script>

<template>
  <section v-if="faqs.length">
    <UContainer class="grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
      <div class="space-y-4">
        <h2 class="font-display text-3xl font-bold text-balance text-highlighted sm:text-4xl">
          {{ block.heading || 'Frequently asked questions' }}
        </h2>
        <p class="text-muted">
          Not covered here?
          <NuxtLink
            to="/contact"
            class="font-medium text-primary hover:underline"
          >Ask us directly</NuxtLink>.
        </p>
      </div>
      <FaqList :faqs="faqs" />
    </UContainer>
  </section>
</template>
