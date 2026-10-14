<script setup lang="ts">
import type { ClientLogo, MarqueeSettings } from '#shared/types/models'

const MIN_LOGOS_TO_SCROLL = 5

const props = defineProps<{
  logos: ClientLogo[]
  marquee: MarqueeSettings
}>()

const scrolling = computed(() => props.marquee.autoplay && props.logos.length >= MIN_LOGOS_TO_SCROLL)
</script>

<template>
  <div
    v-if="scrolling"
    class="marquee overflow-hidden"
    :data-pause="marquee.pauseOnHover"
    :style="{ '--marquee-duration': `${marquee.speed}s` }"
  >
    <div class="marquee-track flex w-max motion-reduce:justify-center">
      <ul class="flex shrink-0 items-center gap-12 pr-12 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8 motion-reduce:pr-0">
        <li
          v-for="logo in logos"
          :key="logo.id"
        >
          <ClientLogoItem :logo="logo" />
        </li>
      </ul>
      <ul
        class="flex shrink-0 items-center gap-12 pr-12 motion-reduce:hidden"
        aria-hidden="true"
      >
        <li
          v-for="logo in logos"
          :key="`copy-${logo.id}`"
        >
          <ClientLogoItem
            :logo="logo"
            decorative
          />
        </li>
      </ul>
    </div>
  </div>
  <ul
    v-else
    class="flex flex-wrap items-center justify-center gap-x-12 gap-y-8"
  >
    <li
      v-for="logo in logos"
      :key="logo.id"
    >
      <ClientLogoItem :logo="logo" />
    </li>
  </ul>
</template>
