<script setup lang="ts">
const props = withDefaults(defineProps<{ as?: string, width?: 'default' | '3xl' | '5xl' }>(), { as: 'div', width: 'default' })

const WIDTHS = { 'default': 'max-w-(--ui-container)', '3xl': 'max-w-3xl', '5xl': 'max-w-5xl' }
</script>

<template>
  <component
    :is="props.as"
    :class="['mx-auto w-full px-4 sm:px-6 lg:px-8', WIDTHS[props.width]]"
  >
    <slot />
  </component>
</template>
