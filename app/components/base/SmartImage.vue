<script setup lang="ts">
import type { MediaAsset } from '#shared/types/models'

const props = withDefaults(defineProps<{
  media: MediaAsset
  sizes?: string
  alt?: string
  priority?: boolean
}>(), {
  sizes: '100vw',
  alt: undefined,
  priority: false,
})

const srcset = computed(() => {
  const entries = props.media.variants.map(variant => `${variant.url} ${variant.width}w`)
  if (props.media.width) entries.push(`${props.media.url} ${props.media.width}w`)
  return entries.length > 1 ? entries.join(', ') : undefined
})

if (props.priority) {
  useHead({
    link: [{
      rel: 'preload',
      as: 'image',
      href: props.media.url,
      imagesrcset: srcset.value,
      imagesizes: srcset.value ? props.sizes : undefined,
      fetchpriority: 'high',
      key: `preload-${props.media.id}`,
    }],
  })
}
</script>

<template>
  <img
    :src="media.url"
    :srcset="srcset"
    :sizes="srcset ? sizes : undefined"
    :width="media.width ?? undefined"
    :height="media.height ?? undefined"
    :alt="alt ?? media.alt"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : 'auto'"
    decoding="async"
  >
</template>
