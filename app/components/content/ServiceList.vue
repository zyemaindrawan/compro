<script setup lang="ts">
import type { ServiceCard } from '#shared/types/models'

defineProps<{
  services: ServiceCard[]
  headingLevel?: 'h2' | 'h3'
}>()
</script>

<template>
  <ul class="grid border-t border-default sm:grid-cols-2">
    <li
      v-for="(service, index) in services"
      :key="service.id"
      v-reveal
      class="border-b border-default sm:odd:border-e"
    >
      <NuxtLink
        :to="`/service/${service.slug}`"
        class="group flex h-full flex-col gap-4 py-8"
        :class="index % 2 === 0 ? 'sm:pe-8' : 'sm:ps-8'"
      >
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs text-dimmed">{{ String(index + 1).padStart(2, '0') }}</span>
          <UIcon
            :name="service.icon"
            class="size-6 text-muted transition-colors group-hover:text-primary"
          />
        </div>
        <component
          :is="headingLevel ?? 'h3'"
          class="font-display text-2xl font-semibold text-highlighted transition-colors group-hover:text-primary"
        >
          {{ service.name }}
        </component>
        <p class="max-w-md text-muted">
          {{ service.summary }}
        </p>
        <span class="mt-auto inline-flex items-center gap-1 text-sm font-medium text-default">
          Learn more
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
