<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { AdminPage, AdminPageListItem } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Pages' })

const api = useApi()
const notify = useNotify()
const format = useFormat()

const { data: pages, refresh, status } = useAsyncData('admin-pages', () => api<AdminPageListItem[]>('/api/admin/pages'), { default: () => [] })

const groups = computed(() => [
  { label: 'Home', items: pages.value.filter(page => page.kind === 'home') },
  { label: 'Service pages', items: pages.value.filter(page => page.kind === 'service') },
  { label: 'Other pages', items: pages.value.filter(page => page.kind === 'static') },
])

const createOpen = ref(false)
const creating = ref(false)
const newTitle = ref('')
const newSlug = ref('')
const deleting = ref<AdminPageListItem | null>(null)

function actions(page: AdminPageListItem): DropdownMenuItem[][] {
  const main: DropdownMenuItem[] = [
    { label: 'Edit', icon: 'i-lucide-pencil', to: `/admin/pages/${page.id}` },
    { label: 'View', icon: 'i-lucide-external-link', to: publicPath(page), target: '_blank' },
  ]
  if (page.kind !== 'static') return [main]
  const remove: DropdownMenuItem = {
    label: 'Delete',
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: () => {
      deleting.value = page
    },
  }
  return [main, [remove]]
}

function publicPath(page: AdminPageListItem) {
  return page.kind === 'home' ? '/' : `/${page.slug}`
}

async function create() {
  creating.value = true
  try {
    const page = await api<AdminPage>('/api/admin/pages', {
      method: 'POST',
      body: {
        title: newTitle.value,
        slug: newSlug.value,
        status: 'draft',
        meta_title: '',
        meta_description: '',
        meta_keywords: [],
        canonical_url: '',
        og_media_id: null,
        noindex: false,
        blocks: [{ type: 'hero', is_visible: true, props: { ...blockDefinition('hero')!.create(), heading: newTitle.value } }],
      },
    })
    createOpen.value = false
    await navigateTo(`/admin/pages/${page.id}`)
  }
  catch (error) {
    notify.error(error, 'Page not created')
  }
  finally {
    creating.value = false
  }
}

async function remove() {
  if (!deleting.value) return
  try {
    await api(`/api/admin/pages/${deleting.value.id}`, { method: 'DELETE' })
    notify.success('Page deleted')
    deleting.value = null
    await refresh()
  }
  catch (error) {
    notify.error(error)
  }
}

watch(createOpen, (open) => {
  if (open) {
    newTitle.value = ''
    newSlug.value = ''
  }
})
</script>

<template>
  <AdminPanel
    id="pages"
    title="Pages"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="New page"
        @click="createOpen = true"
      />
    </template>

    <div class="mx-auto max-w-3xl space-y-8">
      <div
        v-if="status === 'pending' && !pages.length"
        class="space-y-2"
      >
        <USkeleton
          v-for="n in 5"
          :key="n"
          class="h-14"
        />
      </div>
      <section
        v-for="group in groups"
        v-else
        :key="group.label"
        class="space-y-2"
      >
        <h2 class="text-sm font-semibold text-highlighted">
          {{ group.label }}
        </h2>
        <p
          v-if="!group.items.length"
          class="text-sm text-muted"
        >
          None yet.
        </p>
        <ul
          v-else
          class="divide-y divide-default rounded-lg border border-default"
        >
          <li
            v-for="page in group.items"
            :key="page.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="`/admin/pages/${page.id}`"
                class="block truncate font-medium text-highlighted hover:text-primary"
              >
                {{ page.title }}
              </NuxtLink>
              <p class="truncate font-mono text-xs text-dimmed">
                {{ publicPath(page) }}
              </p>
            </div>
            <span class="hidden text-xs text-muted sm:inline">{{ format.date(page.updatedAt) }}</span>
            <UBadge
              :label="page.status === 'published' ? 'Published' : 'Draft'"
              :color="page.status === 'published' ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            />
            <UDropdownMenu
              :items="actions(page)"
              :content="{ align: 'end' }"
            >
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                size="sm"
                :aria-label="`Actions for ${page.title}`"
              />
            </UDropdownMenu>
          </li>
        </ul>
      </section>
      <p class="text-xs text-muted">
        Service pages are created from the Services screen.
      </p>
    </div>

    <UModal
      v-model:open="createOpen"
      title="New page"
      description="Starts as a draft with a hero block."
    >
      <template #body>
        <form
          id="new-page"
          class="space-y-4"
          @submit.prevent="create"
        >
          <UFormField
            label="Title"
            required
          >
            <UInput
              v-model="newTitle"
              class="w-full"
              autofocus
            />
          </UFormField>
          <SlugInput
            v-model="newSlug"
            :source="newTitle"
            prefix="/"
          />
        </form>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            @click="createOpen = false"
          />
          <UButton
            type="submit"
            form="new-page"
            label="Create page"
            :loading="creating"
            :disabled="!newTitle || !newSlug"
          />
        </div>
      </template>
    </UModal>

    <UModal
      :open="Boolean(deleting)"
      :title="`Delete ${deleting?.title}?`"
      description="The page disappears from the site right away."
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
            label="Delete page"
            color="error"
            @click="remove"
          />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
