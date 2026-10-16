<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ block: BlockProps<'cta'> }>()
</script>

<template>
  <section class="border-y border-default bg-elevated">
    <AppContainer class="flex flex-col gap-8 py-16 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl space-y-3">
        <h2 class="font-display text-3xl font-bold text-balance text-highlighted sm:text-4xl">
          {{ block.heading }}
        </h2>
        <p
          v-if="block.body"
          class="text-lg text-pretty text-muted"
        >
          {{ block.body }}
        </p>
      </div>
      <CtaLink
        :link="block.primary"
        color="primary"
        trailing-icon="i-lucide-arrow-right"
      />
    </AppContainer>
  </section>
</template>
