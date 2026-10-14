<script setup lang="ts">
import type { ClientLogo } from '#shared/types/models'

withDefaults(defineProps<{
  logo: ClientLogo
  decorative?: boolean
}>(), {
  decorative: false,
})
</script>

<template>
  <component
    :is="logo.url ? 'a' : 'span'"
    :href="logo.url || undefined"
    :target="logo.url ? '_blank' : undefined"
    :rel="logo.url ? 'noopener noreferrer' : undefined"
    :tabindex="decorative ? -1 : undefined"
    class="block opacity-70 grayscale transition duration-200 ease-out hover:opacity-100 hover:grayscale-0 focus-visible:opacity-100 focus-visible:grayscale-0"
  >
    <SmartImage
      :media="logo.logo"
      :alt="decorative ? '' : logo.logo.alt || logo.name"
      sizes="160px"
      class="h-10 w-auto max-w-40 object-contain"
    />
  </component>
</template>
