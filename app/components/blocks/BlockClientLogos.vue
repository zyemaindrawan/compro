<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

defineProps<{ block: BlockProps<'client_logos'>, data: BlockData }>()

const { settings } = useSiteSettings()
const marquee = computed(() => settings.value?.marquee ?? { autoplay: true, speed: 40, pauseOnHover: true })
</script>

<template>
  <section
    v-if="data.logos.length"
    :aria-label="block.heading || 'Clients'"
  >
    <AppContainer class="space-y-8 py-12 sm:py-16">
      <h2
        v-if="block.heading"
        class="text-center text-sm font-medium text-muted"
      >
        {{ block.heading }}
      </h2>
      <LogoMarquee
        :logos="data.logos"
        :marquee="marquee"
      />
    </AppContainer>
  </section>
</template>
