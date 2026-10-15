<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { CategorySummary } from '#shared/types/models'

defineProps<{ path: string }>()
const block = defineModel<BlockProps<'latest_articles'>>({ required: true })

const api = useApi()
const { data: categories } = useAsyncData('admin-category-options', () => api<CategorySummary[]>('/api/admin/categories'), { default: () => [] })
const categoryOptions = computed(() => [{ label: 'All categories', value: 'all' }, ...categories.value.map(category => ({ label: category.name, value: category.slug }))])

const category = computed({
  get: () => block.value.category_slug || 'all',
  set: (value: string) => {
    block.value.category_slug = value === 'all' ? '' : value
  },
})
const limit = computed({
  get: () => String(block.value.limit),
  set: (value: string) => {
    block.value.limit = value === '6' ? 6 : 3
  },
})
</script>

<template>
  <div class="space-y-4">
    <UFormField
      label="Heading"
      :name="`${path}.heading`"
    >
      <UInput
        v-model="block.heading"
        class="w-full"
      />
    </UFormField>
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        label="Category"
        :name="`${path}.category_slug`"
      >
        <USelect
          v-model="category"
          :items="categoryOptions"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Number of articles"
        :name="`${path}.limit`"
      >
        <USelect
          v-model="limit"
          :items="[{ label: '3', value: '3' }, { label: '6', value: '6' }]"
          class="w-full"
        />
      </UFormField>
    </div>
  </div>
</template>
