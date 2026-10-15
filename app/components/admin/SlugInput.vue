<script setup lang="ts">
const props = withDefaults(defineProps<{
  source: string
  prefix: string
  name?: string
  autoSync?: boolean
}>(), {
  name: 'slug',
  autoSync: true,
})

const slug = defineModel<string>({ required: true })
const synced = ref(props.autoSync && (!slug.value || slug.value === slugify(props.source)))

watch(() => props.source, (value) => {
  if (synced.value) slug.value = slugify(value)
})

function onInput(value: string | number) {
  synced.value = false
  slug.value = String(value).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-')
}

function regenerate() {
  slug.value = slugify(props.source)
  synced.value = true
}
</script>

<template>
  <UFormField
    label="Slug"
    :name="name"
    :help="`${prefix}${slug || '…'}`"
    required
  >
    <UInput
      :model-value="slug"
      class="w-full font-mono"
      :ui="{ base: 'text-sm' }"
      @update:model-value="onInput"
    >
      <template #trailing>
        <UTooltip text="Generate from title">
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="link"
            size="sm"
            aria-label="Generate slug from title"
            @click="regenerate"
          />
        </UTooltip>
      </template>
    </UInput>
  </UFormField>
</template>
