<script setup lang="ts">
import type { MediaPurpose } from '#shared/schemas/media.schema'
import type { MediaAsset } from '#shared/types/models'

const props = withDefaults(defineProps<{ purpose?: MediaPurpose, compact?: boolean }>(), {
  purpose: 'content',
  compact: false,
})
const emit = defineEmits<{ uploaded: [media: MediaAsset[]] }>()

const api = useApi()
const notify = useNotify()
const files = ref<File[] | null>(null)
const progress = ref<{ done: number, total: number } | null>(null)

const accept = computed(() => props.purpose === 'content'
  ? 'image/jpeg,image/png,image/webp,image/avif,image/gif'
  : 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml')

watch(files, async (selected) => {
  if (!selected?.length) return
  const queue = [...selected]
  files.value = null
  progress.value = { done: 0, total: queue.length }
  const uploaded: MediaAsset[] = []

  for (const file of queue) {
    const body = new FormData()
    body.append('file', file)
    body.append('purpose', props.purpose)
    body.append('alt', file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim())
    try {
      uploaded.push(await api<MediaAsset>('/api/admin/media', { method: 'POST', body }))
    }
    catch (error) {
      notify.error(error, `Could not upload ${file.name}`)
    }
    progress.value.done++
  }

  progress.value = null
  if (uploaded.length) {
    notify.success(uploaded.length === 1 ? 'Image uploaded' : `${uploaded.length} images uploaded`, 'Converted to WebP. Add alt text so screen readers and search engines understand it.')
    emit('uploaded', uploaded)
  }
})
</script>

<template>
  <UFileUpload
    v-model="files"
    multiple
    :accept="accept"
    :disabled="Boolean(progress)"
    :preview="false"
    icon="i-lucide-image-up"
    :label="progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : 'Drop images here or click to browse'"
    :description="purpose === 'content' ? 'JPG, PNG, WebP, AVIF or GIF up to 10 MB. Saved as WebP.' : 'JPG, PNG, WebP or SVG up to 10 MB.'"
    :class="compact ? 'min-h-28' : 'min-h-36'"
  />
</template>
