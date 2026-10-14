<script setup lang="ts">
import type { PortfolioItem } from '#shared/types/models'

withDefaults(defineProps<{
  item: PortfolioItem
  headingLevel?: 'h2' | 'h3'
}>(), {
  headingLevel: 'h3',
})
</script>

<template>
  <article class="group relative flex flex-col gap-3">
    <div class="overflow-hidden rounded-lg border border-default bg-elevated">
      <SmartImage
        :media="item.thumbnail"
        :alt="item.thumbnail.alt || item.title"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        class="aspect-[16/10] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.015]"
      />
    </div>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 space-y-1">
        <p
          v-if="item.service"
          class="text-xs font-medium text-primary"
        >
          {{ item.service.name }}
        </p>
        <component
          :is="headingLevel"
          class="font-display text-lg font-semibold text-balance text-highlighted"
        >
          <a
            :href="item.externalUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors after:absolute after:inset-0 group-hover:text-primary"
          >
            {{ item.title }}
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </component>
      </div>
      <UIcon
        name="i-lucide-arrow-up-right"
        class="mt-1 size-5 shrink-0 text-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
      />
    </div>
  </article>
</template>
