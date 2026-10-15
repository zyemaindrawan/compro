<script setup lang="ts">
const props = defineProps<{
  link: { label: string, href: string }
  color?: 'primary' | 'neutral'
  variant?: 'solid' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  trailingIcon?: string
}>()

const external = computed(() => /^https?:\/\//.test(props.link.href))
</script>

<template>
  <BaseButton
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
