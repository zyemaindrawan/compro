<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { useSortable } from '@vueuse/integrations/useSortable'
import { formSchema, type FormFieldInput, type FormInput } from '#shared/schemas/engagement.schema'
import type { AdminForm, FormFieldDef } from '#shared/types/models'
import { emptySubmission } from '#shared/utils/form-validation'

const props = defineProps<{ form: AdminForm }>()

type EditableField = FormFieldInput & { key: string }

const api = useApi()
const notify = useNotify()
const formRef = useTemplateRef('formRef')
const list = useTemplateRef<HTMLElement>('list')
const saving = ref(false)
const lockedIds = ref(new Set(props.form.fields.map(field => field.id)))

function toState(form: AdminForm): Omit<FormInput, 'fields'> & { fields: EditableField[] } {
  return {
    name: form.name,
    submit_label: form.submitLabel,
    success_message: form.successMessage,
    notify_emails: [...form.notifyEmails],
    fields: form.fields.map(field => ({
      key: field.id,
      id: field.id,
      name: field.name,
      label: field.label,
      type: field.type as FormFieldInput['type'],
      placeholder: field.placeholder,
      help_text: field.helpText,
      options: field.options.map(option => ({ ...option })),
      required: field.required,
      validation: { ...field.validation },
      width: field.width,
    })),
  }
}

const state = ref(toState(props.form))
const baseline = ref(JSON.stringify(state.value))
const isDirty = computed(() => JSON.stringify(state.value) !== baseline.value)
const openKey = ref<string | null>(null)
const removing = ref<number | null>(null)
useUnsavedGuard(isDirty)

useSortable(list, computed({
  get: () => state.value.fields,
  set: (fields) => {
    state.value.fields = fields
  },
}), { handle: '[data-drag-handle]', animation: 150 })

const previewFields = computed<FormFieldDef[]>(() => state.value.fields.map(field => ({
  id: field.key,
  name: field.name,
  label: field.label || 'Untitled field',
  type: field.type,
  placeholder: field.placeholder,
  helpText: field.help_text,
  options: field.options,
  required: field.required,
  validation: field.validation,
  width: field.width,
})))
const previewState = ref<Record<string, unknown>>({})
watch(previewFields, (fields) => {
  previewState.value = { ...emptySubmission(fields), ...previewState.value }
}, { immediate: true, deep: true })

function addField() {
  const key = crypto.randomUUID()
  state.value.fields = [...state.value.fields, {
    key,
    name: '',
    label: '',
    type: 'text',
    placeholder: '',
    help_text: '',
    options: [],
    required: false,
    validation: {},
    width: 'full',
  }]
  openKey.value = key
}

function removeField() {
  if (removing.value === null) return
  state.value.fields = state.value.fields.filter((_, index) => index !== removing.value)
  removing.value = null
}

function updateField(index: number, value: FormFieldInput) {
  const current = state.value.fields[index]
  if (!current) return
  state.value.fields[index] = { ...value, key: current.key }
}

async function onSubmit(event: FormSubmitEvent<FormInput>) {
  saving.value = true
  try {
    const saved = await api<AdminForm>(`/api/admin/forms/${props.form.id}`, { method: 'PUT', body: event.data })
    state.value = toState(saved)
    lockedIds.value = new Set(saved.fields.map(field => field.id))
    baseline.value = JSON.stringify(state.value)
    notify.success('Form saved')
  }
  catch (error) {
    const fields = apiFieldErrors(error)
    if (fields.length) formRef.value?.setErrors(fields)
    notify.error(error, 'Form not saved')
  }
  finally {
    saving.value = false
  }
}

defineShortcuts({
  meta_s: () => formRef.value?.submit(),
})
</script>

<template>
  <AdminPanel
    id="form-builder"
    :title="state.name || 'Form'"
  >
    <template #actions>
      <UBadge
        v-if="isDirty"
        label="Unsaved"
        color="warning"
        variant="subtle"
        class="hidden sm:inline-flex"
      />
      <UButton
        :to="`/admin/submissions?form=${form.key}`"
        label="Submissions"
        icon="i-lucide-inbox"
        color="neutral"
        variant="ghost"
        class="hidden sm:inline-flex"
      />
      <UButton
        label="Save"
        icon="i-lucide-save"
        :loading="saving"
        @click="formRef?.submit()"
      />
    </template>

    <UForm
      ref="formRef"
      :schema="formSchema"
      :state="state"
      class="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
      @submit="onSubmit"
    >
      <div class="space-y-6">
        <UPageCard
          title="Settings"
          variant="subtle"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Form name"
              name="name"
              required
            >
              <UInput
                v-model="state.name"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Button text"
              name="submit_label"
              required
            >
              <UInput
                v-model="state.submit_label"
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Message after sending"
              name="success_message"
              class="sm:col-span-2"
              required
            >
              <UTextarea
                v-model="state.success_message"
                :rows="2"
                autoresize
                class="w-full"
              />
            </UFormField>
            <UFormField
              label="Email new submissions to"
              name="notify_emails"
              help="Press Enter after each address. Empty sends to the site email from Settings."
              class="sm:col-span-2"
            >
              <UInputTags
                v-model="state.notify_emails"
                placeholder="sales@company.com"
                class="w-full"
              />
            </UFormField>
          </div>
        </UPageCard>

        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-semibold text-highlighted">
              Fields
            </h2>
            <UButton
              icon="i-lucide-plus"
              label="Add field"
              color="neutral"
              variant="outline"
              size="sm"
              @click="addField"
            />
          </div>
          <UFormField name="fields">
            <ol
              ref="list"
              class="space-y-2"
            >
              <li
                v-for="(field, index) in state.fields"
                :key="field.key"
                class="rounded-lg border border-default bg-default"
              >
                <div class="flex items-center gap-2 px-2 py-2">
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
                  <button
                    type="button"
                    class="flex min-w-0 flex-1 items-center gap-2 text-left"
                    :aria-expanded="openKey === field.key"
                    @click="openKey = openKey === field.key ? null : field.key"
                  >
                    <span class="truncate text-sm font-medium text-highlighted">{{ field.label || 'Untitled field' }}</span>
                    <span class="shrink-0 font-mono text-xs text-muted">{{ field.type }}</span>
                    <span
                      v-if="field.required"
                      class="shrink-0 text-xs text-error"
                    >required</span>
                  </button>
                  <UButton
                    icon="i-lucide-trash-2"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :aria-label="`Remove ${field.label || 'field'}`"
                    @click="removing = index"
                  />
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="size-4 shrink-0 text-muted transition-transform duration-200"
                    :class="openKey === field.key ? 'rotate-180' : ''"
                  />
                </div>
                <div
                  v-if="openKey === field.key"
                  class="border-t border-default p-4"
                >
                  <FormFieldEditor
                    :model-value="field"
                    :index="index"
                    :locked="Boolean(field.id && lockedIds.has(field.id))"
                    @update:model-value="value => updateField(index, value)"
                  />
                </div>
              </li>
            </ol>
          </UFormField>
        </section>
      </div>

      <aside class="space-y-3 xl:sticky xl:top-4 xl:self-start">
        <h2 class="text-sm font-semibold text-highlighted">
          Preview
        </h2>
        <div class="grid gap-5 rounded-lg border border-dashed border-default p-5 sm:grid-cols-2">
          <DynamicField
            v-for="field in previewFields"
            :key="field.id"
            v-model="previewState[field.name]"
            :field="field"
          />
          <div class="sm:col-span-2">
            <UButton
              :label="state.submit_label || 'Send'"
              trailing-icon="i-lucide-arrow-right"
              disabled
            />
          </div>
        </div>
      </aside>
    </UForm>

    <ConfirmDialog
      :open="removing !== null"
      title="Remove this field?"
      description="Existing submissions keep their answers, but the field no longer appears on the form."
      confirm-label="Remove field"
      @confirm="removeField"
      @cancel="removing = null"
    />
  </AdminPanel>
</template>
