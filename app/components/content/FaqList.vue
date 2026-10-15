<script setup lang="ts">
import type { Faq } from '#shared/types/models'

defineProps<{ faqs: Faq[] }>()
</script>

<template>
  <div class="divide-y divide-default border-y border-default">
    <details
      v-for="faq in faqs"
      :key="faq.id"
      class="group"
    >
      <summary class="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-highlighted transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
        {{ faq.question }}
        <UIcon
          name="i-lucide-plus"
          class="size-5 shrink-0 text-muted transition-transform duration-200 ease-out group-open:rotate-45"
          aria-hidden="true"
        />
      </summary>
      <p class="pb-5 whitespace-pre-line text-pretty text-muted">
        {{ faq.answer }}
      </p>
    </details>
  </div>
</template>
