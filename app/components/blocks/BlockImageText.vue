<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'image_text'>, data: BlockData }>()

const media = computed(() => (props.block.media_id ? props.data.media[props.block.media_id] : undefined))
const paragraphs = computed(() => props.block.body.split(/\n{2,}/).map(part => part.trim()).filter(Boolean))
</script>

<template>
  <section>
    <AppContainer class="grid gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
      <SmartImage
        v-if="media"
        v-reveal
        :media="media"
        sizes="(min-width: 1024px) 50vw, 100vw"
        class="w-full rounded-lg border border-default object-cover"
        :class="block.image_side === 'right' ? 'lg:order-2' : ''"
      />
      <div
        v-reveal
        class="space-y-5"
      >
        <h2 class="font-display text-3xl font-bold text-balance text-highlighted sm:text-4xl">
          {{ block.heading }}
        </h2>
        <p
          v-for="(paragraph, index) in paragraphs"
          :key="index"
          class="text-lg text-pretty text-muted"
        >
          {{ paragraph }}
        </p>
        <CtaLink
          :link="block.cta"
          color="neutral"
          variant="outline"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>
    </AppContainer>
  </section>
</template>
