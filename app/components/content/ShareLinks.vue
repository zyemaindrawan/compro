<script setup lang="ts">
const props = defineProps<{ title: string, url: string }>()

const { copy, copied } = useClipboard()
const encoded = computed(() => ({ url: encodeURIComponent(props.url), title: encodeURIComponent(props.title) }))

const links = computed(() => [
  { label: 'Share on LinkedIn', icon: 'i-simple-icons-linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded.value.url}` },
  { label: 'Share on X', icon: 'i-simple-icons-x', href: `https://x.com/intent/post?url=${encoded.value.url}&text=${encoded.value.title}` },
  { label: 'Share on Facebook', icon: 'i-simple-icons-facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encoded.value.url}` },
  { label: 'Share on WhatsApp', icon: 'i-simple-icons-whatsapp', href: `https://wa.me/?text=${encoded.value.title}%20${encoded.value.url}` },
])
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <span class="me-2 text-sm text-muted">Share</span>
    <BaseButton
      v-for="link in links"
      :key="link.label"
      :to="link.href"
      target="_blank"
      rel="noopener noreferrer"
      :icon="link.icon"
      :aria-label="link.label"
      color="neutral"
      variant="ghost"
      size="sm"
    />
    <BaseButton
      :icon="copied ? 'i-lucide-check' : 'i-lucide-link'"
      :aria-label="copied ? 'Link copied' : 'Copy link'"
      color="neutral"
      variant="ghost"
      size="sm"
      @click="copy(url)"
    />
  </div>
</template>
