<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SubmissionQuery, SubmissionStatus } from '#shared/schemas/engagement.schema'
import type { Paginated, SubmissionListItem } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Submissions' })

type StatusFilter = SubmissionQuery['status']

const api = useApi()
const notify = useNotify()
const format = useFormat()
const route = useRoute()
const router = useRouter()

const ALL_FORMS = 'all'
const queryString = (key: string) => (typeof route.query[key] === 'string' ? route.query[key] : '')
const page = ref(Number(queryString('page')) || 1)
const status = ref<StatusFilter>((queryString('status') as StatusFilter) || 'new')
const formKey = ref(queryString('form') || ALL_FORMS)
const search = ref(queryString('q'))
const query = refDebounced(search, 300)
const selected = ref<string[]>([])
const confirmDelete = ref(false)
const working = ref(false)

watch([query, status, formKey], () => {
  page.value = 1
})

watch([page, query, status, formKey], () => {
  router.replace({
    query: {
      status: status.value === 'new' ? undefined : status.value,
      form: formKey.value === ALL_FORMS ? undefined : formKey.value,
      q: query.value || undefined,
      page: page.value > 1 ? page.value : undefined,
    },
  })
})

const filters = computed(() => ({
  page: page.value,
  status: status.value,
  form: formKey.value === ALL_FORMS ? undefined : formKey.value,
  q: query.value || undefined,
}))

const { data, status: loadState, refresh } = useAsyncData(
  () => `admin-submissions-${JSON.stringify(filters.value)}`,
  () => api<Paginated<SubmissionListItem>>('/api/admin/submissions', { query: filters.value }),
  { watch: [filters] },
)
const { data: counts, refresh: refreshCounts } = useSubmissionCounts()
const { data: forms } = useAsyncData('admin-form-options', () => api<{ key: string, name: string }[]>('/api/admin/forms/options'), { default: () => [] })

watch(data, () => {
  selected.value = []
})

const statusTabs = computed(() => {
  const value = counts.value
  const tab = (key: StatusFilter, label: string, count?: number) => ({ label, value: key, badge: count ? String(count) : undefined })
  return [
    tab('new', 'New', value?.new),
    tab('contacted', 'Contacted', value?.contacted),
    tab('won', 'Won', value?.won),
    tab('lost', 'Lost', value?.lost),
    tab('all', 'All', value?.allButSpam),
    tab('spam', 'Spam', value?.spam),
  ]
})

const formItems = computed(() => [{ label: 'All forms', value: ALL_FORMS }, ...forms.value.map(form => ({ label: form.name, value: form.key }))])

const exportUrl = computed(() => {
  const params = new URLSearchParams({ status: status.value })
  if (filters.value.form) params.set('form', filters.value.form)
  if (filters.value.q) params.set('q', filters.value.q)
  return `/api/admin/submissions/export.csv?${params}`
})

const allSelected = computed({
  get: () => Boolean(data.value?.items.length) && selected.value.length === data.value?.items.length,
  set: (value: boolean) => {
    selected.value = value ? data.value?.items.map(item => item.id) ?? [] : []
  },
})

function toggle(id: string, value: boolean | 'indeterminate') {
  selected.value = value === true ? [...selected.value, id] : selected.value.filter(item => item !== id)
}

async function afterChange() {
  await Promise.all([refresh(), refreshCounts()])
}

async function setStatus(next: SubmissionStatus) {
  working.value = true
  try {
    await api('/api/admin/submissions', { method: 'PATCH', body: { ids: selected.value, status: next } })
    notify.success(`Marked as ${SUBMISSION_STATUS_META[next].label.toLowerCase()}`)
    await afterChange()
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    working.value = false
  }
}

async function removeSelected() {
  working.value = true
  try {
    await api('/api/admin/submissions', { method: 'DELETE', body: { ids: selected.value } })
    notify.success(selected.value.length === 1 ? 'Submission deleted' : `${selected.value.length} submissions deleted`)
    confirmDelete.value = false
    await afterChange()
  }
  catch (error) {
    notify.error(error)
  }
  finally {
    working.value = false
  }
}

const bulkItems = computed<DropdownMenuItem[]>(() => SUBMISSION_STATUS_ITEMS.map(item => ({
  label: item.label,
  icon: item.icon,
  onSelect: () => setStatus(item.value),
})))
</script>

<template>
  <AdminPanel
    id="submissions"
    title="Submissions"
  >
    <template #actions>
      <UButton
        :href="exportUrl"
        external
        download
        icon="i-lucide-download"
        label="Export CSV"
        color="neutral"
        variant="outline"
      />
    </template>

    <div class="space-y-4">
      <UTabs
        v-model="status"
        :items="statusTabs"
        :content="false"
        size="sm"
        class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        :ui="{ list: 'w-max min-w-full', trigger: 'flex-none sm:flex-1' }"
      />
      <div class="flex flex-col gap-3 sm:flex-row">
        <USelect
          v-model="formKey"
          :items="formItems"
          class="w-full sm:w-48"
          aria-label="Filter by form"
        />
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search name or email"
          class="w-full sm:w-72"
        />
      </div>

      <div
        v-if="selected.length"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-default bg-elevated px-3 py-2 text-sm"
      >
        <span>{{ selected.length }} selected</span>
        <div class="flex gap-2">
          <UDropdownMenu :items="bulkItems">
            <UButton
              label="Mark as"
              trailing-icon="i-lucide-chevron-down"
              color="neutral"
              variant="outline"
              size="sm"
              :loading="working"
            />
          </UDropdownMenu>
          <UButton
            label="Delete"
            icon="i-lucide-trash-2"
            color="error"
            variant="soft"
            size="sm"
            @click="confirmDelete = true"
          />
        </div>
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
        icon="i-lucide-inbox"
        :title="query || formKey !== ALL_FORMS ? 'No submissions match' : 'Nothing here yet'"
        :description="query || formKey !== ALL_FORMS ? 'Try another search or form.' : 'Messages from the contact and quote forms appear here.'"
      />

      <div
        v-else
        class="overflow-hidden rounded-lg border border-default"
      >
        <div class="hidden grid-cols-[2rem_minmax(0,1fr)_10rem_7rem_11rem] items-center gap-4 border-b border-default bg-elevated/50 px-4 py-2 text-xs font-medium text-muted md:grid">
          <UCheckbox
            v-model="allSelected"
            aria-label="Select all"
          />
          <span>From</span>
          <span>Form</span>
          <span>Status</span>
          <span>Received</span>
        </div>
        <ul class="divide-y divide-default">
          <li
            v-for="item in data.items"
            :key="item.id"
            class="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 px-4 py-3 md:grid-cols-[2rem_minmax(0,1fr)_10rem_7rem_11rem] md:items-center"
          >
            <UCheckbox
              :model-value="selected.includes(item.id)"
              :aria-label="`Select ${item.name || item.email}`"
              class="pt-0.5 md:pt-0"
              @update:model-value="value => toggle(item.id, value)"
            />
            <div class="min-w-0">
              <NuxtLink
                :to="`/admin/submissions/${item.id}`"
                class="block truncate text-highlighted hover:text-primary"
                :class="item.status === 'new' ? 'font-semibold' : 'font-medium'"
              >
                {{ item.name || item.email || 'Unnamed' }}
              </NuxtLink>
              <p class="truncate text-xs text-muted">
                {{ item.email }}
              </p>
            </div>
            <p class="col-start-2 truncate text-sm text-muted md:col-start-auto">
              {{ item.formName }}
            </p>
            <div class="col-start-2 md:col-start-auto">
              <UBadge
                :label="SUBMISSION_STATUS_META[item.status].label"
                :color="SUBMISSION_STATUS_META[item.status].color"
                variant="subtle"
                size="sm"
              />
            </div>
            <p class="col-start-2 text-xs text-muted md:col-start-auto md:text-sm">
              {{ format.dateTime(item.createdAt) }}
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

    <ConfirmDialog
      :open="confirmDelete"
      :title="`Delete ${selected.length} ${selected.length === 1 ? 'submission' : 'submissions'}?`"
      description="Deleted submissions cannot be recovered. Export them first if you need a record."
      @confirm="removeSelected"
      @cancel="confirmDelete = false"
    />
  </AdminPanel>
</template>
