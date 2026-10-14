<script setup lang="ts">
import type { MediaPurpose } from '#shared/schemas/media.schema'
import type { MediaAsset, Paginated } from '#shared/types/models'

const props = withDefaults(defineProps<{
  selectedId?: string | null
  purpose?: MediaPurpose
  perPage?: number
}>(), {
  selectedId: null,
  purpose: 'content',
  perPage: 24,
})
const emit = defineEmits<{ select: [media: MediaAsset] }>()

const api = useApi()
const page = ref(1)
const search = ref('')
const query = refDebounced(search, 300)

watch(query, () => {
  page.value = 1
})

const { data, status, refresh } = useAsyncData(
  () => `admin-media-${page.value}-${query.value}-${props.perPage}`,
  () => api<Paginated<MediaAsset>>('/api/admin/media', {
    query: { page: page.value, perPage: props.perPage, q: query.value || undefined },
  }),
  { watch: [page, query] },
)

defineExpose({ refresh })

async function onUploaded(media: MediaAsset[]) {
  page.value = 1
  search.value = ''
  await refresh()
  if (media.length === 1 && media[0]) emit('select', media[0])
}
</script>

<template>
  <div class="space-y-4">
    <MediaUploader
      :purpose="purpose"
      compact
      @uploaded="onUploaded"
    />

    <UInput
      v-model="search"
      icon="i-lucide-search"
      placeholder="Search by alt text"
      class="w-full sm:max-w-xs"
    />

    <div
      v-if="status === 'pending' && !data"
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
    >
      <USkeleton
        v-for="n in 12"
        :key="n"
        class="aspect-square"
      />
    </div>

    <EmptyState
      v-else-if="!data?.items.length"
      icon="i-lucide-image-off"
      :title="query ? 'No images match your search' : 'No images yet'"
      :description="query ? 'Try a different word.' : 'Upload your first image above.'"
    />

    <ul
      v-else
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
    >
      <li
        v-for="item in data.items"
        :key="item.id"
      >
        <button
          type="button"
          class="group relative block aspect-square w-full overflow-hidden rounded-lg border bg-elevated text-left transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          :class="item.id === selectedId ? 'border-primary ring-2 ring-primary' : 'border-default hover:border-accented'"
          :aria-pressed="item.id === selectedId"
          @click="emit('select', item)"
        >
          <img
            :src="item.variants[0]?.url ?? item.url"
            :alt="item.alt"
            loading="lazy"
            class="size-full object-contain p-2"
          >
          <span class="absolute inset-x-0 bottom-0 truncate bg-default/90 px-2 py-1 text-xs text-muted">
            {{ item.alt || 'No alt text' }}
          </span>
          <UIcon
            v-if="item.id === selectedId"
            name="i-lucide-circle-check"
            class="absolute top-2 right-2 size-5 text-primary"
          />
        </button>
      </li>
    </ul>

    <div
      v-if="data && data.total > data.perPage"
      class="flex justify-center"
    >
      <UPagination
        v-model:page="page"
        :total="data.total"
        :items-per-page="data.perPage"
      />
    </div>
  </div>
</template>
