<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { clientLogoSchema, type ClientLogoInput } from '#shared/schemas/engagement.schema'
import type { AdminClientLogo } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Clients' })

const form = useTemplateRef('form')
const collection = useCollectionAdmin<AdminClientLogo, ClientLogoInput>({
  key: 'admin-client-logos',
  endpoint: '/api/admin/client-logos',
  noun: 'logo',
  blank: () => ({ name: '', logo_media_id: '', url: '', is_active: true }),
  toInput: item => ({ name: item.name, logo_media_id: item.logo.id, url: item.url, is_active: item.isActive }),
})
const { items, status, editing, deleting, state, formOpen, saving } = collection

const logoId = computed({
  get: () => state.value.logo_media_id || null,
  set: (value: string | null) => {
    state.value.logo_media_id = value ?? ''
  },
})

function onSubmit(event: FormSubmitEvent<ClientLogoInput>) {
  return collection.save(event.data, errors => form.value?.setErrors(errors))
}
</script>

<template>
  <AdminPanel
    id="clients"
    title="Clients"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Add logo"
        @click="collection.openCreate"
      />
    </template>

    <div class="mx-auto w-full max-w-3xl space-y-3">
      <p class="text-sm text-muted">
        Logos show in grayscale and turn to colour on hover. Five or more logos scroll; speed and pause are under
        <ULink
          to="/admin/settings"
          class="text-primary"
        >Settings</ULink>.
      </p>
      <SortableList
        :items="items"
        :loading="status === 'pending'"
        empty-icon="i-lucide-building-2"
        empty-title="No client logos yet"
        empty-description="Upload SVG or transparent PNG logos for the best result."
        @reorder="collection.reorder"
      >
        <template #default="{ item }">
          <div class="flex h-10 w-24 shrink-0 items-center justify-center rounded border border-default bg-elevated/50 px-2">
            <SmartImage
              :media="item.logo"
              sizes="96px"
              class="max-h-8 w-auto object-contain"
            />
          </div>
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block max-w-full truncate text-left font-medium text-highlighted hover:text-primary"
              @click="collection.openEdit(item)"
            >
              {{ item.name }}
            </button>
            <p class="truncate text-xs text-muted">
              {{ item.url ? item.url.replace(/^https?:\/\//, '') : 'No link' }}
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
              :aria-label="`Actions for ${item.name}`"
            />
          </UDropdownMenu>
        </template>
      </SortableList>
    </div>

    <FormSlideover
      v-model:open="formOpen"
      :title="editing ? 'Edit logo' : 'Add logo'"
      form-id="client-form"
      :submit-label="editing ? 'Save changes' : 'Add logo'"
      :saving="saving"
    >
      <UForm
        id="client-form"
        ref="form"
        :schema="clientLogoSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Client name"
          name="name"
          help="Used as alt text when the logo has none."
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
            autofocus
          />
        </UFormField>
        <MediaField
          v-model="logoId"
          label="Logo"
          name="logo_media_id"
          purpose="logo"
          :initial="editing?.logo ?? null"
        />
        <UFormField
          label="Link"
          name="url"
          help="Optional. Opens in a new tab."
        >
          <UInput
            v-model="state.url"
            type="url"
            placeholder="https://"
            class="w-full"
          />
        </UFormField>
        <USwitch
          v-model="state.is_active"
          label="Show on the site"
        />
      </UForm>
    </FormSlideover>

    <ConfirmDialog
      :open="Boolean(deleting)"
      :title="`Delete ${deleting?.name}?`"
      description="The logo is removed from the site. The image stays in the media library."
      confirm-label="Delete logo"
      @confirm="collection.remove"
      @cancel="deleting = null"
    />
  </AdminPanel>
</template>
