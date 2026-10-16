<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'

defineProps<{ block: BlockProps<'cta'> }>()
</script>

<template>
  <section class="py-14 sm:py-20">
    <AppContainer>
      <div class="relative isolate overflow-hidden rounded-2xl border border-default bg-elevated px-6 py-10 sm:px-12 sm:py-14">
        <CloudOrnament />
        <div
          aria-hidden="true"
          class="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent sm:inset-x-12"
        />
        <div class="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
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
            class="shrink-0"
          />
        </div>
      </div>
    </AppContainer>
  </section>
</template>
