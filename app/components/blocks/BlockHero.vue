<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{
  block: BlockProps<'hero'>
  data: BlockData
  first: boolean
}>()

const media = computed(() => (props.block.media_id ? props.data.media[props.block.media_id] : undefined))
</script>

<template>
  <section class="relative isolate overflow-hidden border-b border-default">
    <HeroOrnament />
    <AppContainer
      class="grid gap-10 py-14 sm:gap-12 sm:py-28 lg:items-center"
      :class="media ? 'lg:grid-cols-2' : ''"
    >
      <div class="max-w-3xl space-y-5 sm:space-y-6">
        <p
          v-if="block.eyebrow"
          class="text-sm font-medium text-primary"
        >
          {{ block.eyebrow }}
        </p>
        <component
          :is="first ? 'h1' : 'h2'"
          class="font-display text-4xl font-bold text-balance text-highlighted sm:text-6xl"
        >
          {{ block.heading }}
        </component>
        <p
          v-if="block.subheading"
          class="max-w-2xl text-lg text-pretty text-muted"
        >
          {{ block.subheading }}
        </p>
        <div
          v-if="block.primary.label || block.secondary.label"
          class="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <CtaLink
            :link="block.primary"
            trailing-icon="i-lucide-arrow-right"
            class="w-full justify-center sm:w-auto"
          />
          <CtaLink
            :link="block.secondary"
            color="neutral"
            variant="outline"
            class="w-full justify-center sm:w-auto"
          />
        </div>
      </div>
      <SmartImage
        v-if="media"
        :media="media"
        :priority="first"
        sizes="(min-width: 1024px) 50vw, 100vw"
        class="w-full rounded-lg border border-default object-cover"
      />
    </AppContainer>
  </section>
</template>
