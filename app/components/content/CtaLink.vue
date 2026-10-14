<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'

const props = defineProps<{
  link: { label: string, href: string }
  color?: ButtonProps['color']
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  trailingIcon?: string
}>()

const external = computed(() => /^https?:\/\//.test(props.link.href))
</script>

<template>
  <UButton
    v-if="link.label && link.href"
    :to="link.href"
    :label="link.label"
    :color="color"
    :variant="variant"
    :size="size ?? 'lg'"
    :trailing-icon="trailingIcon"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
  />
</template>
