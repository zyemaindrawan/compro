<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { redirectSchema, type RedirectInput } from '#shared/schemas/redirect.schema'
import { REDIRECT_STATUS_CODES } from '#shared/constants'
import type { AdminRedirect, Paginated } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Redirects' })

const STATUS_LABELS: Record<RedirectInput['status_code'], string> = {
  301: '301 Moved permanently',
  302: '302 Temporary',
  308: '308 Permanent, keeps method',
}

const api = useApi()
const notify = useNotify()
const format = useFormat()
const form = useTemplateRef('form')

const page = ref(1)
const search = ref('')
const query = refDebounced(search, 300)
watch(query, () => {
  page.value = 1
})

const { data, status, refresh } = useAsyncData(
  () => `admin-redirects-${page.value}-${query.value}`,
  () => api<Paginated<AdminRedirect>>('/api/admin/redirects', { query: { page: page.value, q: query.value || undefined } }),
  { watch: [page, query] },
)

const statusItems = REDIRECT_STATUS_CODES.map(code => ({ label: STATUS_LABELS[code], value: code }))
const blank = (): RedirectInput => ({ from_path: '', to_path: '', status_code: 301 })
const state = ref<RedirectInput>(blank())
const editing = ref<AdminRedirect | null>(null)
const deleting = ref<AdminRedirect | null>(null)
const formOpen = ref(false)
const saving = ref(false)

function openCreate() {
  editing.value = null
  state.value = blank()
  formOpen.value = true
}

function openEdit(item: AdminRedirect) {
  editing.value = item
  state.value = { from_path: item.fromPath, to_path: item.toPath, status_code: item.statusCode }
  formOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<RedirectInput>) {
  saving.value = true
  try {
    await api(editing.value ? `/api/admin/redirects/${editing.value.id}` : '/api/admin/redirects', {
      method: editing.value ? 'PUT' : 'POST',
      body: event.data,
    })
    notify.success(editing.value ? 'Redirect updated' : 'Redirect added')
    formOpen.value = false
    await refresh()
  }
  catch (error) {
    form.value?.setErrors(apiFieldErrors(error))
    notify.error(error, 'Redirect not saved')
  }
  finally {
    saving.value = false
  }
}

async function remove() {
  const target = deleting.value
  if (!target) return
  try {
    await api(`/api/admin/redirects/${target.id}`, { method: 'DELETE' })
    notify.success('Redirect deleted')
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
    id="redirects"
    title="Redirects"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Add redirect"
        @click="openCreate"
      />
    </template>

    <div class="mx-auto w-full max-w-4xl space-y-4">
      <p class="text-sm text-muted">
        Changing an article, category, page or service slug adds a 301 here automatically. Add rules by hand for URLs from an old site.
      </p>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search paths"
        class="w-full sm:w-72"
      />

      <div
        v-if="status === 'pending' && !data"
        class="space-y-2"
      >
        <USkeleton
          v-for="n in 5"
          :key="n"
          class="h-14"
        />
      </div>
      <EmptyState
        v-else-if="!data?.items.length"
        icon="i-lucide-corner-down-right"
        :title="query ? 'No redirects match' : 'No redirects yet'"
        :description="query ? 'Try another path.' : 'Slug changes and rules you add appear here.'"
      />
      <ul
        v-else
        class="divide-y divide-default overflow-hidden rounded-lg border border-default"
      >
        <li
          v-for="item in data.items"
          :key="item.id"
          class="flex items-center gap-3 bg-default px-4 py-3"
        >
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block max-w-full truncate text-left font-mono text-sm text-highlighted hover:text-primary"
              @click="openEdit(item)"
            >
              {{ item.fromPath }}
            </button>
            <p class="flex min-w-0 items-center gap-1 text-xs text-muted">
              <UIcon
                name="i-lucide-corner-down-right"
                class="size-3.5 shrink-0"
              />
              <span class="truncate font-mono">{{ item.toPath }}</span>
            </p>
          </div>
          <UBadge
            :label="String(item.statusCode)"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <span class="hidden w-40 text-right text-xs text-muted md:block">{{ format.dateTime(item.updatedAt) }}</span>
          <UDropdownMenu
            :items="[
              [
                { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEdit(item) },
                { label: 'Test', icon: 'i-lucide-external-link', to: item.fromPath, target: '_blank' },
              ],
              [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => { deleting = item } }],
            ]"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="`Actions for ${item.fromPath}`"
            />
          </UDropdownMenu>
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

    <FormSlideover
      v-model:open="formOpen"
      :title="editing ? 'Edit redirect' : 'Add redirect'"
      form-id="redirect-form"
      :submit-label="editing ? 'Save changes' : 'Add redirect'"
      :saving="saving"
    >
      <UForm
        id="redirect-form"
        ref="form"
        :schema="redirectSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Old path"
          name="from_path"
          help="The path visitors or search engines still request, for example /blog/old-post."
          required
        >
          <UInput
            v-model="state.from_path"
            placeholder="/old-path"
            class="w-full font-mono"
            autofocus
          />
        </UFormField>
        <UFormField
          label="Target"
          name="to_path"
          help="A path on this site or a full URL."
          required
        >
          <UInput
            v-model="state.to_path"
            placeholder="/new-path"
            class="w-full font-mono"
          />
        </UFormField>
        <UFormField
          label="Type"
          name="status_code"
          help="Use 301 unless the move is temporary."
        >
          <USelect
            v-model="state.status_code"
            :items="statusItems"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </FormSlideover>

    <ConfirmDialog
      :open="Boolean(deleting)"
      :title="`Delete the redirect from ${deleting?.fromPath}?`"
      description="Visitors to the old path will get a 404 again."
      confirm-label="Delete redirect"
      @confirm="remove"
      @cancel="deleting = null"
    />
  </AdminPanel>
</template>
