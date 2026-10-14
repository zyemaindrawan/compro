<script setup lang="ts">
import type { SocialLinkInput } from '#shared/schemas/settings.schema'

const props = defineProps<{
  index: number
  first: boolean
  last: boolean
}>()
const emit = defineEmits<{ move: [offset: number], remove: [] }>()
const link = defineModel<SocialLinkInput>({ required: true })

const platforms = [
  { value: 'linkedin', label: 'LinkedIn', icon: 'i-simple-icons-linkedin' },
  { value: 'github', label: 'GitHub', icon: 'i-simple-icons-github' },
  { value: 'instagram', label: 'Instagram', icon: 'i-simple-icons-instagram' },
  { value: 'facebook', label: 'Facebook', icon: 'i-simple-icons-facebook' },
  { value: 'x', label: 'X', icon: 'i-simple-icons-x' },
  { value: 'youtube', label: 'YouTube', icon: 'i-simple-icons-youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'i-simple-icons-tiktok' },
  { value: 'dribbble', label: 'Dribbble', icon: 'i-simple-icons-dribbble' },
  { value: 'behance', label: 'Behance', icon: 'i-simple-icons-behance' },
  { value: 'threads', label: 'Threads', icon: 'i-simple-icons-threads' },
  { value: 'other', label: 'Other', icon: 'i-lucide-link' },
]

const isOther = computed(() => link.value.platform === 'other')
const field = (key: string) => `social_links.${props.index}.${key}`

function setPlatform(value: unknown) {
  const platform = platforms.find(item => item.value === value)
  if (!platform) return
  link.value = {
    ...link.value,
    platform: platform.value,
    label: platform.value === 'other' ? link.value.label : platform.label,
    icon: platform.icon,
  }
}
</script>

<template>
  <li class="grid gap-3 rounded-lg border border-default p-3 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
    <UFormField :name="field('platform')">
      <USelect
        :model-value="link.platform"
        :items="platforms"
        :icon="link.icon"
        aria-label="Platform"
        class="w-full"
        @update:model-value="setPlatform"
      />
    </UFormField>
    <div
      class="grid gap-3"
      :class="{ 'sm:grid-cols-2': isOther }"
    >
      <UFormField
        v-if="isOther"
        :name="field('label')"
      >
        <UInput
          v-model="link.label"
          placeholder="Label"
          aria-label="Label"
          class="w-full"
        />
      </UFormField>
      <UFormField :name="field('url')">
        <UInput
          v-model="link.url"
          type="url"
          placeholder="https://"
          aria-label="URL"
          class="w-full"
        />
      </UFormField>
    </div>
    <div class="flex items-center justify-between gap-1 sm:justify-end">
      <USwitch
        v-model="link.is_active"
        :aria-label="`Show ${link.label}`"
        class="me-2"
      />
      <UButton
        icon="i-lucide-arrow-up"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Move up"
        :disabled="first"
        @click="emit('move', -1)"
      />
      <UButton
        icon="i-lucide-arrow-down"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Move down"
        :disabled="last"
        @click="emit('move', 1)"
      />
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        size="sm"
        aria-label="Remove link"
        @click="emit('remove')"
      />
    </div>
  </li>
</template>
