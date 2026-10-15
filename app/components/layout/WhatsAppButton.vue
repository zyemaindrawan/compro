<script setup lang="ts">
const { settings } = useSiteSettings()

const href = computed(() => {
  const number = settings.value?.whatsappNumber
  if (!number) return null
  const text = settings.value?.whatsappMessage
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`
})
</script>

<template>
  <a
    v-if="href"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat with us on WhatsApp"
    class="fixed right-4 bottom-4 z-40 inline-flex size-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-black/10 transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-whatsapp sm:right-6 sm:bottom-6"
  >
    <UIcon
      name="i-simple-icons-whatsapp"
      class="size-6"
    />
  </a>
</template>
