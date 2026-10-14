<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { articleSchema, type ArticleInput } from '#shared/schemas/article.schema'
import { emptySeo } from '#shared/schemas/seo.schema'
import type { AdminArticle, CategorySummary } from '#shared/types/models'

const props = defineProps<{ article?: AdminArticle | null }>()

const api = useApi()
const notify = useNotify()
const format = useFormat()
const form = useTemplateRef('form')
const saving = ref(false)
const confirmDelete = ref(false)

const { data: categories } = useAsyncData('admin-category-options', () => api<CategorySummary[]>('/api/admin/categories'), {
  default: () => [],
})

function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function toState(article?: AdminArticle | null): ArticleInput {
  if (!article) {
    return {
      ...emptySeo(),
      title: '',
      slug: '',
      excerpt: '',
      content_json: { type: 'doc', content: [{ type: 'paragraph' }] },
      content_html: '',
      cover_media_id: null,
      category_ids: [],
      status: 'draft',
      published_at: null,
    }
  }
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content_json: article.contentJson,
    content_html: article.contentHtml,
    cover_media_id: article.cover?.id ?? null,
    category_ids: [...article.categoryIds],
    status: article.status,
    published_at: article.publishedAt,
    meta_title: article.seo.metaTitle,
    meta_description: article.seo.metaDescription,
    meta_keywords: [...article.seo.metaKeywords],
    canonical_url: article.seo.canonicalUrl,
    og_media_id: article.seo.ogImage?.id ?? null,
    noindex: article.seo.noindex,
  }
}

const state = ref<ArticleInput>(toState(props.article))
const baseline = ref(JSON.stringify(state.value))
const isDirty = computed(() => JSON.stringify(state.value) !== baseline.value)
useUnsavedGuard(isDirty)

const publishedLocal = computed({
  get: () => toLocalInput(state.value.published_at),
  set: (value: string) => {
    state.value.published_at = value ? new Date(value).toISOString() : null
  },
})

const isPublished = computed(() => props.article?.status === 'published')
const isScheduled = computed(() => state.value.status === 'published' && state.value.published_at && new Date(state.value.published_at) > new Date())
const wordCount = computed(() => state.value.content_html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length)

async function persist(status: ArticleInput['status']) {
  saving.value = true
  const body = { ...state.value, status }
  try {
    const saved = await api<AdminArticle>(props.article ? `/api/admin/articles/${props.article.id}` : '/api/admin/articles', {
      method: props.article ? 'PUT' : 'POST',
      body,
    })
    state.value = toState(saved)
    baseline.value = JSON.stringify(state.value)
    notify.success(status === 'published' ? 'Article published' : 'Draft saved')
    if (!props.article) await navigateTo(`/admin/articles/${saved.id}`, { replace: true })
    return saved
  }
  catch (error) {
    const fields = apiFieldErrors(error)
    if (fields.length) form.value?.setErrors(fields)
    notify.error(error, 'Article not saved')
  }
  finally {
    saving.value = false
  }
}

function onSubmit(event: FormSubmitEvent<ArticleInput>) {
  return persist(event.data.status)
}

async function submitAs(status: ArticleInput['status']) {
  state.value.status = status
  await nextTick()
  form.value?.submit()
}

async function remove() {
  if (!props.article) return
  try {
    await api('/api/admin/articles', { method: 'DELETE', body: { ids: [props.article.id] } })
    baseline.value = JSON.stringify(state.value)
    notify.success('Article deleted')
    await navigateTo('/admin/articles')
  }
  catch (error) {
    notify.error(error, 'Could not delete the article')
  }
}

const previewUrl = computed(() => props.article ? `/article/${props.article.slug}?preview=${props.article.id}` : null)

defineShortcuts({
  meta_s: () => form.value?.submit(),
})
</script>

<template>
  <AdminPanel
    :id="article ? 'article-edit' : 'article-new'"
    :title="article ? 'Edit article' : 'New article'"
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
        v-if="previewUrl"
        :to="previewUrl"
        target="_blank"
        icon="i-lucide-eye"
        color="neutral"
        variant="ghost"
        label="Preview"
        class="hidden sm:inline-flex"
      />
      <UButton
        v-if="!isPublished"
        label="Save draft"
        color="neutral"
        variant="outline"
        :loading="saving && state.status === 'draft'"
        @click="submitAs('draft')"
      />
      <UButton
        :label="isPublished ? 'Update' : 'Publish'"
        :icon="isPublished ? 'i-lucide-save' : 'i-lucide-send'"
        :loading="saving && state.status === 'published'"
        @click="submitAs('published')"
      />
    </template>

    <UForm
      ref="form"
      :schema="articleSchema"
      :state="state"
      class="grid grid-cols-[minmax(0,1fr)] gap-6 pb-16 xl:grid-cols-[minmax(0,1fr)_22rem]"
      @submit="onSubmit"
    >
      <div class="min-w-0 space-y-5">
        <UFormField
          name="title"
          required
        >
          <UInput
            v-model="state.title"
            placeholder="Article title"
            variant="none"
            :ui="{ base: 'px-0 font-display text-3xl font-bold md:text-4xl' }"
            class="w-full"
            aria-label="Title"
          />
        </UFormField>
        <SlugInput
          v-model="state.slug"
          :source="state.title"
          prefix="/article/"
          :auto-sync="!isPublished"
        />
        <UFormField
          label="Excerpt"
          name="excerpt"
          :help="`${state.excerpt.length}/300 · Shown on cards and used as the default meta description.`"
        >
          <UTextarea
            v-model="state.excerpt"
            :rows="2"
            :maxlength="300"
            autoresize
            class="w-full"
          />
        </UFormField>
        <UFormField name="content_html">
          <RichEditor
            v-model:json="state.content_json"
            v-model:html="state.content_html"
          />
          <template #help>
            {{ wordCount }} words · about {{ Math.max(1, Math.round(wordCount / 220)) }} min read
          </template>
        </UFormField>
      </div>

      <aside class="min-w-0 space-y-5">
        <UPageCard
          title="Publishing"
          variant="subtle"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Status</span>
            <UBadge
              :label="isScheduled ? 'Scheduled' : article?.status === 'published' ? 'Published' : 'Draft'"
              :color="article?.status === 'published' ? 'success' : 'neutral'"
              variant="subtle"
            />
          </div>
          <UFormField
            label="Publish date"
            name="published_at"
            help="Leave empty to use the moment you publish. A future date schedules it."
          >
            <UInput
              v-model="publishedLocal"
              type="datetime-local"
              class="w-full"
            />
          </UFormField>
          <p
            v-if="article"
            class="text-xs text-muted"
          >
            Last saved {{ format.dateTime(article.updatedAt) }}
          </p>
          <div
            v-if="article"
            class="flex justify-between"
          >
            <UButton
              v-if="isPublished"
              label="Unpublish"
              color="neutral"
              variant="link"
              size="sm"
              class="px-0"
              @click="submitAs('draft')"
            />
            <UButton
              label="Delete"
              color="error"
              variant="link"
              size="sm"
              class="ms-auto px-0"
              @click="confirmDelete = true"
            />
          </div>
        </UPageCard>

        <UPageCard
          title="Categories"
          variant="subtle"
        >
          <UFormField name="category_ids">
            <USelectMenu
              v-model="state.category_ids"
              :items="categories"
              value-key="id"
              label-key="name"
              multiple
              placeholder="Choose categories"
              class="w-full"
            />
          </UFormField>
          <ULink
            to="/admin/categories"
            class="text-xs text-muted hover:text-default"
          >
            Manage categories
          </ULink>
        </UPageCard>

        <UPageCard
          title="Cover"
          variant="subtle"
        >
          <MediaField
            v-model="state.cover_media_id"
            name="cover_media_id"
            label="Cover image"
            help="16:9, at least 1600 px wide."
            :initial="article?.cover"
          />
        </UPageCard>

        <UPageCard
          title="Search & social"
          variant="subtle"
        >
          <SeoFieldset
            :model-value="state"
            :path="`/article/${state.slug}`"
            :title-fallback="state.title"
            :description-fallback="state.excerpt"
            :og-initial="article?.seo.ogImage"
          />
        </UPageCard>
      </aside>
    </UForm>

    <UModal
      v-model:open="confirmDelete"
      title="Delete this article?"
      description="It disappears from the site right away. This cannot be undone."
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="confirmDelete = false"
          />
          <UButton
            label="Delete article"
            color="error"
            @click="remove"
          />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
