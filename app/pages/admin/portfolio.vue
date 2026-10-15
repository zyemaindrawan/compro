<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { portfolioItemSchema, type PortfolioItemInput } from '#shared/schemas/engagement.schema'
import type { AdminPortfolioItem, AdminService } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Portfolio' })

const api = useApi()
const form = useTemplateRef('form')
const collection = useCollectionAdmin<AdminPortfolioItem, PortfolioItemInput>({
  key: 'admin-portfolio',
  endpoint: '/api/admin/portfolio',
  noun: 'project',
  blank: () => ({ title: '', thumbnail_media_id: '', external_url: '', service_id: null, is_active: true }),
  toInput: item => ({
    title: item.title,
    thumbnail_media_id: item.thumbnail.id,
    external_url: item.externalUrl,
    service_id: item.service?.id ?? null,
    is_active: item.isActive,
  }),
})
const { items, status, editing, deleting, state, formOpen, saving } = collection

const { data: services } = useAsyncData('admin-services', () => api<AdminService[]>('/api/admin/services'), { default: () => [] })
const NO_SERVICE = 'none'
const serviceItems = computed(() => [{ label: 'No service', value: NO_SERVICE }, ...services.value.map(service => ({ label: service.name, value: service.id }))])
const serviceId = computed({
  get: () => state.value.service_id ?? NO_SERVICE,
  set: (value: string) => {
    state.value.service_id = value === NO_SERVICE ? null : value
  },
})
const thumbnailId = computed({
  get: () => state.value.thumbnail_media_id || null,
  set: (value: string | null) => {
    state.value.thumbnail_media_id = value ?? ''
  },
})

function onSubmit(event: FormSubmitEvent<PortfolioItemInput>) {
  return collection.save(event.data, errors => form.value?.setErrors(errors))
}
</script>

<template>
  <AdminPanel
    id="portfolio"
    title="Portfolio"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Add project"
        @click="collection.openCreate"
      />
    </template>

    <div class="mx-auto w-full max-w-3xl space-y-3">
      <p class="text-sm text-muted">
        Each project links to the live site or store listing. Drag to set the order on /portfolio and in portfolio blocks.
      </p>
      <SortableList
        :items="items"
        :loading="status === 'pending'"
        empty-icon="i-lucide-briefcase"
        empty-title="No projects yet"
        empty-description="Add a thumbnail and a link for each shipped project."
        @reorder="collection.reorder"
      >
        <template #default="{ item }">
          <SmartImage
            :media="item.thumbnail"
            sizes="80px"
            class="aspect-[16/10] w-20 shrink-0 rounded border border-default object-cover"
          />
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block max-w-full truncate text-left font-medium text-highlighted hover:text-primary"
              @click="collection.openEdit(item)"
            >
              {{ item.title }}
            </button>
            <p class="truncate text-xs text-muted">
              {{ item.service?.name ?? 'No service' }} · {{ item.externalUrl.replace(/^https?:\/\//, '') }}
            </p>
          </div>
          <UBadge
            v-if="!item.isActive"
            label="Hidden"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <UDropdownMenu
            :items="[
              [
                { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => collection.openEdit(item) },
                { label: item.isActive ? 'Hide' : 'Show', icon: item.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye', onSelect: () => collection.toggleActive(item) },
                { label: 'Open link', icon: 'i-lucide-external-link', to: item.externalUrl, target: '_blank' },
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
              :aria-label="`Actions for ${item.title}`"
            />
          </UDropdownMenu>
        </template>
      </SortableList>
    </div>

    <FormSlideover
      v-model:open="formOpen"
      :title="editing ? 'Edit project' : 'Add project'"
      form-id="portfolio-form"
      :submit-label="editing ? 'Save changes' : 'Add project'"
      :saving="saving"
    >
      <UForm
        id="portfolio-form"
        ref="form"
        :schema="portfolioItemSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Title"
          name="title"
          required
        >
          <UInput
            v-model="state.title"
            class="w-full"
            autofocus
          />
        </UFormField>
        <UFormField
          label="Link"
          name="external_url"
          help="Live site, Play Store listing or case study."
          required
        >
          <UInput
            v-model="state.external_url"
            type="url"
            placeholder="https://"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Service"
          name="service_id"
          help="Used for the filter on /portfolio."
        >
          <USelect
            v-model="serviceId"
            :items="serviceItems"
            class="w-full"
          />
        </UFormField>
        <MediaField
          v-model="thumbnailId"
          label="Thumbnail"
          name="thumbnail_media_id"
          help="Landscape screenshot, at least 1440 px wide."
          :initial="editing?.thumbnail ?? null"
        />
        <USwitch
          v-model="state.is_active"
          label="Show on the site"
        />
      </UForm>
    </FormSlideover>

    <ConfirmDialog
      :open="Boolean(deleting)"
      :title="`Delete ${deleting?.title}?`"
      description="The project is removed from the site. The thumbnail stays in the media library."
      confirm-label="Delete project"
      @confirm="collection.remove"
      @cancel="deleting = null"
    />
  </AdminPanel>
</template>
