<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { categorySchema, type CategoryInput } from '#shared/schemas/article.schema'
import { emptySeo } from '#shared/schemas/seo.schema'
import type { CategoryDetail, CategorySummary } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Categories' })

const api = useApi()
const notify = useNotify()
const form = useTemplateRef('form')

const { data: categories, refresh, status } = useAsyncData('admin-categories', () => api<CategorySummary[]>('/api/admin/categories'), {
  default: () => [],
})

const editing = ref<CategoryDetail | null>(null)
const formOpen = ref(false)
const saving = ref(false)
const deleting = ref<CategorySummary | null>(null)

const blank = (): CategoryInput => ({ ...emptySeo(), name: '', slug: '', description: '' })
const state = ref<CategoryInput>(blank())

function openCreate() {
  editing.value = null
  state.value = blank()
  formOpen.value = true
}

async function openEdit(category: CategorySummary) {
  try {
    const detail = await api<CategoryDetail>(`/api/admin/categories/${category.id}`)
    editing.value = detail
    state.value = {
      name: detail.name,
      slug: detail.slug,
      description: detail.description,
      meta_title: detail.seo.metaTitle,
      meta_description: detail.seo.metaDescription,
      meta_keywords: [...detail.seo.metaKeywords],
      canonical_url: detail.seo.canonicalUrl,
      og_media_id: detail.seo.ogImage?.id ?? null,
      noindex: detail.seo.noindex,
    }
    formOpen.value = true
  }
  catch (error) {
    notify.error(error)
  }
}

async function onSubmit(event: FormSubmitEvent<CategoryInput>) {
  saving.value = true
  try {
    await api(editing.value ? `/api/admin/categories/${editing.value.id}` : '/api/admin/categories', {
      method: editing.value ? 'PUT' : 'POST',
      body: event.data,
    })
    notify.success(editing.value ? 'Category updated' : 'Category created')
    formOpen.value = false
    await refresh()
  }
  catch (error) {
    const fields = apiFieldErrors(error)
    if (fields.length) form.value?.setErrors(fields)
    notify.error(error, 'Category not saved')
  }
  finally {
    saving.value = false
  }
}

async function remove() {
  if (!deleting.value) return
  try {
    await api(`/api/admin/categories/${deleting.value.id}`, { method: 'DELETE' })
    notify.success('Category deleted')
    deleting.value = null
    await refresh()
  }
  catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <AdminPanel
    id="categories"
    title="Categories"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="New category"
        @click="openCreate"
      />
    </template>

    <div class="mx-auto max-w-3xl">
      <div
        v-if="status === 'pending' && !categories.length"
        class="space-y-2"
      >
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-14"
        />
      </div>
      <EmptyState
        v-else-if="!categories.length"
        icon="i-lucide-folder-tree"
        title="No categories yet"
        description="Group articles by topic, for example Engineering or Cloud."
      >
        <UButton
          label="Create a category"
          icon="i-lucide-plus"
          @click="openCreate"
        />
      </EmptyState>
      <ul
        v-else
        class="divide-y divide-default rounded-lg border border-default"
      >
        <li
          v-for="category in categories"
          :key="category.id"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="truncate text-left font-medium text-highlighted hover:text-primary"
              @click="openEdit(category)"
            >
              {{ category.name }}
            </button>
            <p class="truncate font-mono text-xs text-dimmed">
              /articles/category/{{ category.slug }}
            </p>
          </div>
          <UBadge
            :label="`${category.articleCount} ${category.articleCount === 1 ? 'article' : 'articles'}`"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <UDropdownMenu
            :items="[[{ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(category) }, { label: 'View', icon: 'i-lucide-external-link', to: `/articles/category/${category.slug}`, target: '_blank' }], [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => { deleting = category } }]]"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="`Actions for ${category.name}`"
            />
          </UDropdownMenu>
        </li>
      </ul>
    </div>

    <USlideover
      v-model:open="formOpen"
      :title="editing ? 'Edit category' : 'New category'"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #body>
        <UForm
          :id="'category-form'"
          ref="form"
          :schema="categorySchema"
          :state="state"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField
            label="Name"
            name="name"
            required
          >
            <UInput
              v-model="state.name"
              class="w-full"
              autofocus
            />
          </UFormField>
          <SlugInput
            v-model="state.slug"
            :source="state.name"
            prefix="/articles/category/"
            :auto-sync="!editing"
          />
          <UFormField
            label="Description"
            name="description"
            help="Shown at the top of the category page."
          >
            <UTextarea
              v-model="state.description"
              :rows="3"
              :maxlength="500"
              autoresize
              class="w-full"
            />
          </UFormField>
          <USeparator label="Search & social" />
          <SeoFieldset
            :model-value="state"
            :path="`/articles/category/${state.slug}`"
            :title-fallback="state.name"
            :description-fallback="state.description"
            :og-initial="editing?.seo.ogImage"
          />
        </UForm>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="formOpen = false"
          />
          <UButton
            type="submit"
            form="category-form"
            :label="editing ? 'Save changes' : 'Create category'"
            :loading="saving"
          />
        </div>
      </template>
    </USlideover>

    <UModal
      :open="Boolean(deleting)"
      :title="`Delete ${deleting?.name}?`"
      :description="deleting?.articleCount ? `${deleting.articleCount} articles will lose this category. The articles stay published.` : 'This category has no articles.'"
      @update:open="value => { if (!value) deleting = null }"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="deleting = null"
          />
          <UButton
            label="Delete category"
            color="error"
            @click="remove"
          />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
