<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { FormSubmitEvent } from '@nuxt/ui'
import { serviceSchema, type ServiceInput } from '#shared/schemas/page.schema'
import type { AdminService } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Services' })

const api = useApi()
const notify = useNotify()
const form = useTemplateRef('form')
const list = useTemplateRef<HTMLElement>('list')

const { data: services, status } = useAsyncData('admin-services', () => api<AdminService[]>('/api/admin/services'), { default: () => [] })

const editing = ref<AdminService | null>(null)
const formOpen = ref(false)
const saving = ref(false)
const deleting = ref<AdminService | null>(null)
const blank = (): ServiceInput => ({ name: '', slug: '', summary: '', icon: 'i-lucide-box', is_active: true })
const state = ref<ServiceInput>(blank())

useSortable(list, services, {
  handle: '[data-drag-handle]',
  animation: 150,
  onUpdate: async (event: { oldIndex?: number, newIndex?: number }) => {
    if (event.oldIndex === undefined || event.newIndex === undefined) return
    const next = [...services.value]
    const [moved] = next.splice(event.oldIndex, 1)
    if (moved) next.splice(event.newIndex, 0, moved)
    services.value = next
    try {
      services.value = await api<AdminService[]>('/api/admin/services/order', { method: 'PUT', body: { ids: next.map(service => service.id) } })
      notify.success('Order saved')
    }
    catch (error) {
      notify.error(error, 'Order not saved')
    }
  },
})

function openCreate() {
  editing.value = null
  state.value = blank()
  formOpen.value = true
}

function openEdit(service: AdminService) {
  editing.value = service
  state.value = { name: service.name, slug: service.slug, summary: service.summary, icon: service.icon, is_active: service.isActive }
  formOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<ServiceInput>) {
  saving.value = true
  try {
    services.value = await api<AdminService[]>(editing.value ? `/api/admin/services/${editing.value.id}` : '/api/admin/services', {
      method: editing.value ? 'PUT' : 'POST',
      body: event.data,
    })
    notify.success(editing.value ? 'Service updated' : 'Service created')
    formOpen.value = false
  }
  catch (error) {
    const fields = apiFieldErrors(error)
    if (fields.length) form.value?.setErrors(fields)
    notify.error(error, 'Service not saved')
  }
  finally {
    saving.value = false
  }
}

async function openPage(service: AdminService) {
  try {
    const { pageId } = await api<{ pageId: string }>(`/api/admin/services/${service.id}/page`, { method: 'POST' })
    await navigateTo(`/admin/pages/${pageId}`)
  }
  catch (error) {
    notify.error(error)
  }
}

async function remove() {
  if (!deleting.value) return
  try {
    await api(`/api/admin/services/${deleting.value.id}` as string, { method: 'DELETE' })
    services.value = services.value.filter(service => service.id !== deleting.value?.id)
    notify.success('Service deleted')
    deleting.value = null
  }
  catch (error) {
    notify.error(error)
  }
}
</script>

<template>
  <AdminPanel
    id="services"
    title="Services"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="New service"
        @click="openCreate"
      />
    </template>

    <div class="mx-auto w-full max-w-3xl space-y-3">
      <p class="text-sm text-muted">
        Drag to change the order used in the menu, footer and service grids.
      </p>
      <div
        v-if="status === 'pending' && !services.length"
        class="space-y-2"
      >
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-16"
        />
      </div>
      <ul
        ref="list"
        class="divide-y divide-default rounded-lg border border-default"
      >
        <li
          v-for="service in services"
          :key="service.id"
          class="flex items-center gap-3 bg-default px-3 py-3"
        >
          <button
            type="button"
            data-drag-handle
            class="cursor-grab touch-none rounded p-1 text-dimmed hover:text-default"
            aria-label="Drag to reorder"
          >
            <UIcon
              name="i-lucide-grip-vertical"
              class="size-4"
            />
          </button>
          <UIcon
            :name="service.icon"
            class="size-5 shrink-0 text-muted"
          />
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block truncate text-left font-medium text-highlighted hover:text-primary"
              @click="openEdit(service)"
            >
              {{ service.name }}
            </button>
            <p class="truncate text-xs text-muted">
              {{ service.planCount }} {{ service.planCount === 1 ? 'plan' : 'plans' }} · /service/{{ service.slug }}
            </p>
          </div>
          <UBadge
            v-if="!service.isActive"
            label="Hidden"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <UDropdownMenu
            :items="[
              [
                { label: 'Edit details', icon: 'i-lucide-pencil', onSelect: () => openEdit(service) },
                { label: service.pageId ? 'Edit page' : 'Create page', icon: 'i-lucide-layout-template', onSelect: () => openPage(service) },
                { label: 'Edit pricing', icon: 'i-lucide-tags', to: `/admin/pricing?service=${service.id}` },
                { label: 'View', icon: 'i-lucide-external-link', to: `/service/${service.slug}`, target: '_blank' },
              ],
              [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => { deleting = service } }],
            ]"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="`Actions for ${service.name}`"
            />
          </UDropdownMenu>
        </li>
      </ul>
    </div>

    <USlideover
      v-model:open="formOpen"
      :title="editing ? 'Edit service' : 'New service'"
      :ui="{ content: 'max-w-lg' }"
    >
      <template #body>
        <UForm
          id="service-form"
          ref="form"
          :schema="serviceSchema"
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
            prefix="/service/"
            :auto-sync="!editing"
          />
          <UFormField
            label="Summary"
            name="summary"
            help="One or two sentences for cards and search results."
          >
            <UTextarea
              v-model="state.summary"
              :rows="3"
              :maxlength="300"
              autoresize
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Icon"
            name="icon"
            help="Any Lucide icon name, for example i-lucide-smartphone."
          >
            <UInput
              v-model="state.icon"
              class="w-full font-mono"
            >
              <template #leading>
                <UIcon
                  :name="state.icon"
                  class="size-4"
                />
              </template>
            </UInput>
          </UFormField>
          <USwitch
            v-model="state.is_active"
            label="Show on the site"
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
            form="service-form"
            :label="editing ? 'Save changes' : 'Create service'"
            :loading="saving"
          />
        </div>
      </template>
    </USlideover>

    <UModal
      :open="Boolean(deleting)"
      :title="`Delete ${deleting?.name}?`"
      description="Its page and pricing plans are deleted too."
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
            label="Delete service"
            color="error"
            @click="remove"
          />
        </div>
      </template>
    </UModal>
  </AdminPanel>
</template>
