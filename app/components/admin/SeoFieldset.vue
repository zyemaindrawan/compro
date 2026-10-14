<script setup lang="ts">
import type { SeoInput } from '#shared/schemas/seo.schema'
import type { MediaAsset } from '#shared/types/models'

const props = defineProps<{
  path: string
  titleFallback: string
  descriptionFallback: string
  ogInitial?: MediaAsset | null
}>()

const seo = defineModel<SeoInput>({ required: true })
const { settings } = useSiteSettings()
const siteUrl = useSiteConfig().url.replace(/\/$/, '')

const title = computed(() => seo.value.meta_title || props.titleFallback)
const description = computed(() => seo.value.meta_description || props.descriptionFallback)
const fullTitle = computed(() => (settings.value?.titleTemplate ?? '%s').replace('%s', title.value))

function counter(length: number, ideal: [number, number]) {
  if (!length) return 'Using the default'
  if (length < ideal[0]) return `${length} characters, a bit short`
  if (length > ideal[1]) return `${length} characters, may be cut off`
  return `${length} characters`
}
</script>

<template>
  <div class="w-full min-w-0 space-y-4">
    <div class="min-w-0 space-y-1 overflow-hidden rounded-lg border border-default bg-default p-3 text-sm">
      <p class="truncate text-xs text-muted">
        {{ siteUrl }}{{ path }}
      </p>
      <p class="truncate text-base text-info">
        {{ fullTitle }}
      </p>
      <p class="line-clamp-2 text-muted">
        {{ description || 'Add a description so search results show a useful summary.' }}
      </p>
    </div>

    <UFormField
      label="Meta title"
      name="meta_title"
      :help="counter(seo.meta_title.length, [30, 60])"
    >
      <UInput
        v-model="seo.meta_title"
        :placeholder="titleFallback"
        :maxlength="70"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Meta description"
      name="meta_description"
      :help="counter(seo.meta_description.length, [120, 160])"
    >
      <UTextarea
        v-model="seo.meta_description"
        :placeholder="descriptionFallback"
        :rows="3"
        :maxlength="200"
        autoresize
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Keywords"
      name="meta_keywords"
      help="Press Enter after each keyword."
    >
      <UInputTags
        v-model="seo.meta_keywords"
        :max="10"
        placeholder="nuxt, saas"
        class="w-full"
      />
    </UFormField>
    <UFormField
      label="Canonical URL"
      name="canonical_url"
      help="Only when this content first appeared elsewhere."
    >
      <UInput
        v-model="seo.canonical_url"
        type="url"
        placeholder="https://"
        class="w-full"
      />
    </UFormField>
    <MediaField
      v-model="seo.og_media_id"
      name="og_media_id"
      label="Social image"
      help="Falls back to the cover image, then the site default."
      :initial="ogInitial"
    />
    <USwitch
      v-model="seo.noindex"
      label="Hide from search engines"
      description="Adds noindex and removes the page from the sitemap."
    />
  </div>
</template>
