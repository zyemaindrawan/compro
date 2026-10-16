<script setup lang="ts">
import type { Faq } from '#shared/types/models'

defineProps<{ faqs: Faq[] }>()

// Details sharing a name form an exclusive accordion natively, so this works without hydration.
const group = useId()
</script>

<template>
  <div class="faq-list divide-y divide-default border-y border-default">
    <details
      v-for="faq in faqs"
      :key="faq.id"
      :name="group"
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

<style scoped>
.faq-list {
  interpolate-size: allow-keywords;
}

.faq-list details::details-content {
  block-size: 0;
  overflow: hidden;
  transition: block-size 200ms ease-out, content-visibility 200ms allow-discrete;
}

.faq-list details[open]::details-content {
  block-size: auto;
}

@media (prefers-reduced-motion: reduce) {
  .faq-list details::details-content {
    transition: none;
  }
}
</style>
