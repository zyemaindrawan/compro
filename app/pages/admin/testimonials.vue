<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { testimonialSchema, type TestimonialInput } from '#shared/schemas/engagement.schema'
import type { AdminTestimonial } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Testimonials' })

const NO_RATING = 'none'
const ratingItems = [
  { label: 'No rating', value: NO_RATING },
  ...[5, 4, 3, 2, 1].map(value => ({ label: `${value} out of 5`, value: String(value) })),
]

const form = useTemplateRef('form')
const collection = useCollectionAdmin<AdminTestimonial, TestimonialInput>({
  key: 'admin-testimonials',
  endpoint: '/api/admin/testimonials',
  noun: 'testimonial',
  blank: () => ({ author_name: '', author_role: '', company: '', avatar_media_id: null, quote: '', rating: null, is_active: true }),
  toInput: item => ({
    author_name: item.authorName,
    author_role: item.authorRole,
    company: item.company,
    avatar_media_id: item.avatar?.id ?? null,
    quote: item.quote,
    rating: item.rating,
    is_active: item.isActive,
  }),
})
const { items, status, editing, deleting, state, formOpen, saving } = collection

const rating = computed({
  get: () => (state.value.rating ? String(state.value.rating) : NO_RATING),
  set: (value: string) => {
    state.value.rating = value === NO_RATING ? null : Number(value)
  },
})

function onSubmit(event: FormSubmitEvent<TestimonialInput>) {
  return collection.save(event.data, errors => form.value?.setErrors(errors))
}
</script>

<template>
  <AdminPanel
    id="testimonials"
    title="Testimonials"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Add testimonial"
        @click="collection.openCreate"
      />
    </template>

    <div class="mx-auto w-full max-w-3xl space-y-3">
      <p class="text-sm text-muted">
        The first testimonial is shown large in testimonial blocks. Use quotes that name a concrete result.
      </p>
      <SortableList
        :items="items"
        :loading="status === 'pending'"
        empty-icon="i-lucide-message-square-quote"
        empty-title="No testimonials yet"
        empty-description="Ask clients what changed after launch and quote them with permission."
        @reorder="collection.reorder"
      >
        <template #default="{ item }">
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block max-w-full truncate text-left font-medium text-highlighted hover:text-primary"
              @click="collection.openEdit(item)"
            >
              {{ item.authorName }}<span
                v-if="item.company"
                class="font-normal text-muted"
              >, {{ item.company }}</span>
            </button>
            <p class="line-clamp-1 text-xs text-muted">
              {{ item.quote }}
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
              :aria-label="`Actions for ${item.authorName}`"
            />
          </UDropdownMenu>
        </template>
      </SortableList>
    </div>

    <FormSlideover
      v-model:open="formOpen"
      :title="editing ? 'Edit testimonial' : 'Add testimonial'"
      form-id="testimonial-form"
      :submit-label="editing ? 'Save changes' : 'Add testimonial'"
      :saving="saving"
    >
      <UForm
        id="testimonial-form"
        ref="form"
        :schema="testimonialSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Quote"
          name="quote"
          required
        >
          <UTextarea
            v-model="state.quote"
            :rows="4"
            :maxlength="600"
            autoresize
            class="w-full"
            autofocus
          />
        </UFormField>
        <UFormField
          label="Name"
          name="author_name"
          required
        >
          <UInput
            v-model="state.author_name"
            class="w-full"
          />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Role"
            name="author_role"
          >
            <UInput
              v-model="state.author_role"
              placeholder="Operations Manager"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Company"
            name="company"
          >
            <UInput
              v-model="state.company"
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField
          label="Rating"
          name="rating"
        >
          <USelect
            v-model="rating"
            :items="ratingItems"
            class="w-full"
          />
        </UFormField>
        <MediaField
          v-model="state.avatar_media_id"
          label="Photo"
          name="avatar_media_id"
          help="Optional. Initials are shown without a photo."
          :initial="editing?.avatar ?? null"
        />
        <USwitch
          v-model="state.is_active"
          label="Show on the site"
        />
      </UForm>
    </FormSlideover>

    <ConfirmDialog
      :open="Boolean(deleting)"
      :title="`Delete the testimonial from ${deleting?.authorName}?`"
      confirm-label="Delete testimonial"
      @confirm="collection.remove"
      @cancel="deleting = null"
    />
  </AdminPanel>
</template>
