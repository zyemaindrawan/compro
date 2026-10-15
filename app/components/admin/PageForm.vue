<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { pageSchema, type PageInput } from '#shared/schemas/page.schema'
import type { BlockInput } from '#shared/schemas/block.schema'
import type { AdminPage } from '#shared/types/models'

const props = defineProps<{ page: AdminPage }>()
const emit = defineEmits<{ saved: [page: AdminPage] }>()

const api = useApi()
const notify = useNotify()
const format = useFormat()
const form = useTemplateRef('form')
const saving = ref(false)
const media = ref({ ...props.page.media })

type EditableBlock = BlockInput & { key: string }

function toState(page: AdminPage): PageInput & { blocks: EditableBlock[] } {
  return {
    title: page.title,
    slug: page.slug,
    status: page.status,
    meta_title: page.seo.metaTitle,
    meta_description: page.seo.metaDescription,
    meta_keywords: [...page.seo.metaKeywords],
    canonical_url: page.seo.canonicalUrl,
    og_media_id: page.seo.ogImage?.id ?? null,
    noindex: page.seo.noindex,
    blocks: page.blocks.map(block => ({
      id: block.id,
      key: block.id,
      type: block.type,
      is_visible: block.isVisible,
      props: structuredClone(block.props),
    }) as EditableBlock),
  }
}

const state = ref(toState(props.page))
const baseline = ref(JSON.stringify(state.value))
const isDirty = computed(() => JSON.stringify(state.value) !== baseline.value)
useUnsavedGuard(isDirty)

const publicPath = computed(() => {
  if (props.page.kind === 'home') return '/'
  if (props.page.kind === 'service') return `/${props.page.slug}`
  return `/${state.value.slug}`
})
const previewUrl = computed(() => `${publicPath.value}?preview=${props.page.id}`)
const kindLabel = computed(() => ({ home: 'Home page', service: 'Service page', static: 'Page' })[props.page.kind])

async function onSubmit(event: FormSubmitEvent<PageInput>) {
  saving.value = true
  try {
    const saved = await api<AdminPage>(`/api/admin/pages/${props.page.id}`, { method: 'PUT', body: event.data })
    media.value = { ...media.value, ...saved.media }
    state.value = toState(saved)
    baseline.value = JSON.stringify(state.value)
    notify.success(state.value.status === 'published' ? 'Page published' : 'Draft saved')
    emit('saved', saved)
  }
  catch (error) {
    const fields = apiFieldErrors(error)
    if (fields.length) form.value?.setErrors(fields)
    notify.error(error, 'Page not saved')
  }
  finally {
    saving.value = false
  }
}

async function submitAs(status: PageInput['status']) {
  state.value.status = status
  await nextTick()
  form.value?.submit()
}

defineShortcuts({
  meta_s: () => form.value?.submit(),
})
</script>

<template>
  <AdminPanel
    :id="`page-${page.id}`"
    :title="state.title || kindLabel"
  >
    <template #actions>
      <UBadge
        v-if="isDirty"
        label="Unsaved"
        color="warning"
        variant="subtle"
        class="hidden md:inline-flex"
      />
      <UButton
        :to="previewUrl"
        target="_blank"
        icon="i-lucide-eye"
        label="Preview"
        color="neutral"
        variant="ghost"
        class="hidden sm:inline-flex"
      />
      <UButton
        v-if="page.status !== 'published'"
        label="Save draft"
        color="neutral"
        variant="outline"
        :loading="saving && state.status === 'draft'"
        @click="submitAs('draft')"
      />
      <UButton
        :label="page.status === 'published' ? 'Update' : 'Publish'"
        icon="i-lucide-send"
        :loading="saving && state.status === 'published'"
        @click="submitAs('published')"
      />
    </template>

    <UForm
      ref="form"
      :schema="pageSchema"
      :state="state"
      class="grid grid-cols-[minmax(0,1fr)] gap-6 pb-16 xl:grid-cols-[minmax(0,1fr)_22rem]"
      @submit="onSubmit"
    >
      <div class="min-w-0 space-y-4">
        <p class="text-sm text-muted">
          Blocks appear on the page in this order. Drag the handle or use the menu to reorder.
        </p>
        <BlockEditor
          v-model="state.blocks"
          :media="media"
        />
      </div>

      <aside class="min-w-0 space-y-5">
        <UPageCard
          title="Page"
          variant="subtle"
        >
          <UFormField
            label="Title"
            name="title"
            required
            help="Used in the admin and as the default browser title."
          >
            <UInput
              v-model="state.title"
              class="w-full"
            />
          </UFormField>
          <SlugInput
            v-if="page.kind === 'static'"
            v-model="state.slug"
            :source="state.title"
            prefix="/"
            :auto-sync="false"
          />
          <p
            v-else
            class="text-sm text-muted"
          >
            Address: <span class="font-mono">{{ publicPath }}</span>
          </p>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Status</span>
            <UBadge
              :label="page.status === 'published' ? 'Published' : 'Draft'"
              :color="page.status === 'published' ? 'success' : 'neutral'"
              variant="subtle"
            />
          </div>
          <p class="text-xs text-muted">
            Last saved {{ format.dateTime(page.updatedAt) }}
          </p>
          <UButton
            v-if="page.status === 'published' && page.kind !== 'home'"
            label="Unpublish"
            color="neutral"
            variant="link"
            size="sm"
            class="self-start px-0"
            @click="submitAs('draft')"
          />
        </UPageCard>

        <UPageCard
          title="Search & social"
          variant="subtle"
        >
          <SeoFieldset
            :model-value="state"
            :path="publicPath"
            :title-fallback="state.title"
            description-fallback="Taken from the hero intro when empty."
            :og-initial="page.seo.ogImage"
          />
        </UPageCard>
      </aside>
    </UForm>
  </AdminPanel>
</template>
