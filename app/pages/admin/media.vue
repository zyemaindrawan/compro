<script setup lang="ts">
import type { MediaAsset } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Media' })

const api = useApi()
const notify = useNotify()
const format = useFormat()
const { copy } = useClipboard()

const library = useTemplateRef('library')
const selected = ref<MediaAsset | null>(null)
const alt = ref('')
const saving = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)

const detailOpen = computed({
  get: () => Boolean(selected.value),
  set: (value: boolean) => {
    if (!value) selected.value = null
  },
})

function open(media: MediaAsset) {
  selected.value = media
  alt.value = media.alt
}

async function saveAlt() {
  if (!selected.value) return
  saving.value = true
  try {
    selected.value = await api<MediaAsset>(`/api/admin/media/${selected.value.id}`, { method: 'PATCH', body: { alt: alt.value } })
    notify.success('Alt text saved')
    await library.value?.refresh()
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    saving.value = false
  }
}

async function remove() {
  if (!selected.value) return
  deleting.value = true
  try {
    await api(`/api/admin/media/${selected.value.id}`, { method: 'DELETE' })
    notify.success('Image deleted')
    confirmDelete.value = false
    selected.value = null
    await library.value?.refresh()
  }
  catch (error) {
    notify.error(error, 'Could not delete this image')
  }
  finally {
    deleting.value = false
  }
}

async function copyUrl() {
  if (!selected.value) return
  await copy(selected.value.url)
  notify.success('URL copied')
}
</script>

<template>
  <AdminPanel
    id="media"
    title="Media"
  >
    <MediaLibrary
      ref="library"
      :selected-id="selected?.id"
      @select="open"
    />

    <USlideover
      v-model:open="detailOpen"
      title="Image details"
      :ui="{ content: 'max-w-md' }"
    >
      <template
        v-if="selected"
        #body
      >
        <div class="space-y-5">
          <div class="flex items-center justify-center rounded-lg border border-default bg-elevated p-3">
            <img
              :src="selected.url"
              :alt="selected.alt"
              class="max-h-72 object-contain"
            >
          </div>

          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt class="text-muted">
              Dimensions
            </dt>
            <dd>{{ selected.width && selected.height ? `${selected.width} × ${selected.height}` : '—' }}</dd>
            <dt class="text-muted">
              Size
            </dt>
            <dd>{{ format.bytes(selected.sizeBytes) }} · {{ selected.mime.replace('image/', '').toUpperCase() }}</dd>
            <dt class="text-muted">
              Variants
            </dt>
            <dd>{{ selected.variants.length ? selected.variants.map(v => `${v.width}w`).join(', ') : 'None' }}</dd>
            <dt class="text-muted">
              Uploaded
            </dt>
            <dd>{{ format.dateTime(selected.createdAt) }}</dd>
          </dl>

          <form
            class="space-y-3"
            @submit.prevent="saveAlt"
          >
            <UFormField
              label="Alt text"
              help="Describe what the image shows. Leave empty only for purely decorative images."
            >
              <UTextarea
                v-model="alt"
                :rows="2"
                :maxlength="200"
                autoresize
                class="w-full"
              />
            </UFormField>
            <UButton
              type="submit"
              label="Save alt text"
              :loading="saving"
              :disabled="alt === selected.alt"
            />
          </form>
        </div>
      </template>

      <template
        v-if="selected"
        #footer
      >
        <div class="flex w-full justify-between gap-2">
          <UButton
            label="Copy URL"
            icon="i-lucide-link"
            color="neutral"
            variant="outline"
            @click="copyUrl"
          />
          <UModal
            v-model:open="confirmDelete"
            title="Delete this image?"
            description="It will be removed from storage. Images still used on the site cannot be deleted."
          >
            <UButton
              label="Delete"
              icon="i-lucide-trash-2"
              color="error"
              variant="soft"
            />
            <template #footer>
              <div class="flex w-full justify-end gap-2">
                <UButton
                  label="Cancel"
                  color="neutral"
                  variant="ghost"
                  @click="confirmDelete = false"
                />
                <UButton
                  label="Delete image"
                  color="error"
                  :loading="deleting"
                  @click="remove"
                />
              </div>
            </template>
          </UModal>
        </div>
      </template>
    </USlideover>
  </AdminPanel>
</template>
