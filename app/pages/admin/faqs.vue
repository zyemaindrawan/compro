<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { faqSchema, type FaqInput } from '#shared/schemas/engagement.schema'
import type { AdminFaq } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'FAQs' })

const form = useTemplateRef('form')
const collection = useCollectionAdmin<AdminFaq, FaqInput>({
  key: 'admin-faqs',
  endpoint: '/api/admin/faqs',
  noun: 'question',
  blank: () => ({ question: '', answer: '', group_label: '', is_active: true }),
  toInput: item => ({ question: item.question, answer: item.answer, group_label: item.group, is_active: item.isActive }),
})
const { items, status, editing, deleting, state, formOpen, saving } = collection

const groups = computed(() => [...new Set(items.value.map(item => item.group).filter(Boolean))])

function onSubmit(event: FormSubmitEvent<FaqInput>) {
  return collection.save(event.data, errors => form.value?.setErrors(errors))
}
</script>

<template>
  <AdminPanel
    id="faqs"
    title="FAQs"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        label="Add question"
        @click="collection.openCreate"
      />
    </template>

    <div class="mx-auto w-full max-w-3xl space-y-3">
      <p class="text-sm text-muted">
        FAQ blocks show every question or one group. Pages with an FAQ block publish FAQPage structured data.
      </p>
      <SortableList
        :items="items"
        :loading="status === 'pending'"
        empty-icon="i-lucide-circle-help"
        empty-title="No questions yet"
        empty-description="Add the questions prospects ask before they sign."
        @reorder="collection.reorder"
      >
        <template #default="{ item }">
          <div class="min-w-0 flex-1">
            <button
              type="button"
              class="block max-w-full truncate text-left font-medium text-highlighted hover:text-primary"
              @click="collection.openEdit(item)"
            >
              {{ item.question }}
            </button>
            <p class="line-clamp-1 text-xs text-muted">
              {{ item.answer }}
            </p>
          </div>
          <UBadge
            v-if="item.group"
            :label="item.group"
            color="neutral"
            variant="outline"
            size="sm"
            class="hidden sm:inline-flex"
          />
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
              :aria-label="`Actions for ${item.question}`"
            />
          </UDropdownMenu>
        </template>
      </SortableList>
    </div>

    <FormSlideover
      v-model:open="formOpen"
      :title="editing ? 'Edit question' : 'Add question'"
      form-id="faq-form"
      :submit-label="editing ? 'Save changes' : 'Add question'"
      :saving="saving"
    >
      <UForm
        id="faq-form"
        ref="form"
        :schema="faqSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Question"
          name="question"
          required
        >
          <UInput
            v-model="state.question"
            class="w-full"
            autofocus
          />
        </UFormField>
        <UFormField
          label="Answer"
          name="answer"
          help="Plain text. Line breaks are kept."
          required
        >
          <UTextarea
            v-model="state.answer"
            :rows="5"
            :maxlength="2000"
            autoresize
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Group"
          name="group_label"
          help="Optional. FAQ blocks can show a single group."
        >
          <UInput
            v-model="state.group_label"
            list="faq-groups"
            placeholder="Pricing"
            class="w-full"
          />
          <datalist id="faq-groups">
            <option
              v-for="group in groups"
              :key="group"
              :value="group"
            />
          </datalist>
        </UFormField>
        <USwitch
          v-model="state.is_active"
          label="Show on the site"
        />
      </UForm>
    </FormSlideover>

    <ConfirmDialog
      :open="Boolean(deleting)"
      title="Delete this question?"
      :description="deleting?.question"
      confirm-label="Delete question"
      @confirm="collection.remove"
      @cancel="deleting = null"
    />
  </AdminPanel>
</template>
