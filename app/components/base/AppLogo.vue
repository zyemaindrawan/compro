<script setup lang="ts">
import { NuxtLink } from '#components'

const props = withDefaults(defineProps<{ to?: string | false }>(), { to: '/' })

const { settings } = useSiteSettings()
const dark = computed(() => settings.value?.logoDark ?? settings.value?.logoLight)
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'span'"
    :to="props.to || undefined"
    class="inline-flex items-center gap-2 font-display text-lg font-bold text-highlighted"
    :aria-label="props.to ? settings?.siteName ?? 'Home' : undefined"
  >
    <template v-if="settings?.logoLight && dark">
      <img
        :src="settings.logoLight.url"
        :width="settings.logoLight.width ?? undefined"
        :height="settings.logoLight.height ?? undefined"
        :alt="settings.siteName"
        class="h-8 w-auto dark:hidden"
      >
      <img
        :src="dark.url"
        :width="dark.width ?? undefined"
        :height="dark.height ?? undefined"
        :alt="settings.siteName"
        class="hidden h-8 w-auto dark:block"
      >
    </template>
    <span v-else>{{ settings?.siteName }}</span>
  </component>
</template>
