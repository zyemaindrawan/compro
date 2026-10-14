<script setup lang="ts">
import type { AdminArticleListItem, Paginated } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Articles' })

const api = useApi()
const notify = useNotify()
const format = useFormat()

const page = ref(1)
const search = ref('')
const status = ref<'all' | 'draft' | 'published'>('all')
const query = refDebounced(search, 300)
const selected = ref<string[]>([])
const confirmDelete = ref(false)
const deleting = ref(false)

watch([query, status], () => {
  page.value = 1
})

const { data, status: loadState, refresh } = useAsyncData(
  () => `admin-articles-${page.value}-${query.value}-${status.value}`,
  () => api<Paginated<AdminArticleListItem>>('/api/admin/articles', {
    query: { page: page.value, q: query.value || undefined, status: status.value === 'all' ? undefined : status.value },
  }),
  { watch: [page, query, status] },
)

watch(data, () => {
  selected.value = []
})

const statusTabs = [
  { label: 'All', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Drafts', value: 'draft' },
]

const allSelected = computed({
  get: () => Boolean(data.value?.items.length) && selected.value.length === data.value?.items.length,
  set: (value: boolean) => {
    selected.value = value ? data.value?.items.map(item => item.id) ?? [] : []
  },
})

function toggle(id: string, value: boolean | 'indeterminate') {
  selected.value = value === true ? [...selected.value, id] : selected.value.filter(item => item !== id)
}

function isScheduled(item: AdminArticleListItem) {
  return item.status === 'published' && item.publishedAt && new Date(item.publishedAt) > new Date()
}

async function removeSelected() {
  deleting.value = true
  try {
    const result = await api<{ removed: number }>('/api/admin/articles', { method: 'DELETE', body: { ids: selected.value } })
    notify.success(result.removed === 1 ? 'Article deleted' : `${result.removed} articles deleted`)
    confirmDelete.value = false
    await refresh()
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <AdminPanel
    id="articles"
    title="Articles"
  >
    <template #actions>
      <UButton
        to="/admin/articles/new"
        icon="i-lucide-plus"
        label="New article"
      />
    </template>

    <div class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <UTabs
          v-model="status"
          :items="statusTabs"
          :content="false"
          size="sm"
          class="w-full sm:w-auto"
        />
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search titles"
          class="w-full sm:w-64"
        />
      </div>

      <div
        v-if="selected.length"
        class="flex items-center justify-between rounded-lg border border-default bg-elevated px-3 py-2 text-sm"
      >
        <span>{{ selected.length }} selected</span>
        <UButton
          label="Delete"
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          size="sm"
          @click="confirmDelete = true"
        />
      </div>

      <div
        v-if="loadState === 'pending' && !data"
        class="space-y-2"
      >
        <USkeleton
          v-for="n in 6"
          :key="n"
          class="h-16"
        />
      </div>

      <EmptyState
        v-else-if="!data?.items.length"
        icon="i-lucide-newspaper"
        :title="query || status !== 'all' ? 'No articles match' : 'No articles yet'"
        :description="query || status !== 'all' ? 'Try another search or filter.' : 'Write the first one. Drafts stay private until you publish.'"
      >
        <UButton
          v-if="!query && status === 'all'"
          to="/admin/articles/new"
          label="Write an article"
          icon="i-lucide-pen-line"
        />
      </EmptyState>

      <div
        v-else
        class="overflow-hidden rounded-lg border border-default"
      >
        <div class="hidden grid-cols-[2rem_minmax(0,1fr)_12rem_8rem_11rem] items-center gap-4 border-b border-default bg-elevated/50 px-4 py-2 text-xs font-medium text-muted md:grid">
          <UCheckbox
            v-model="allSelected"
            aria-label="Select all"
          />
          <span>Title</span>
          <span>Categories</span>
          <span>Status</span>
          <span>Updated</span>
        </div>
        <ul class="divide-y divide-default">
          <li
            v-for="item in data.items"
            :key="item.id"
            class="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 px-4 py-3 md:grid-cols-[2rem_minmax(0,1fr)_12rem_8rem_11rem] md:items-center"
          >
            <UCheckbox
              :model-value="selected.includes(item.id)"
              :aria-label="`Select ${item.title}`"
              class="pt-0.5 md:pt-0"
              @update:model-value="value => toggle(item.id, value)"
            />
            <div class="min-w-0">
              <NuxtLink
                :to="`/admin/articles/${item.id}`"
                class="block truncate font-medium text-highlighted hover:text-primary"
              >
                {{ item.title }}
              </NuxtLink>
              <p class="truncate font-mono text-xs text-dimmed">
                /article/{{ item.slug }}
              </p>
            </div>
            <p class="col-start-2 truncate text-sm text-muted md:col-start-auto">
              {{ item.categories.map(category => category.name).join(', ') || '—' }}
            </p>
            <div class="col-start-2 md:col-start-auto">
              <UBadge
                :label="isScheduled(item) ? 'Scheduled' : item.status === 'published' ? 'Published' : 'Draft'"
                :color="item.status === 'published' ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
              />
            </div>
            <p class="col-start-2 text-xs text-muted md:col-start-auto md:text-sm">
              {{ format.dateTime(item.updatedAt) }}
            </p>
          </li>
        </ul>
      </div>

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

    <UModal
      v-model:open="confirmDelete"
      :title="`Delete ${selected.length} ${selected.length === 1 ? 'article' : 'articles'}?`"
      description="They disappear from the site right away. This cannot be undone."
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
            label="Delete"
            color="error"
            :loading="deleting"
            @click="removeSelected"
          />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
