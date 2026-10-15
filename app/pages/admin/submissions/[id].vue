<script setup lang="ts">
import type { SubmissionStatus } from '#shared/schemas/engagement.schema'
import type { SubmissionDetail } from '#shared/types/models'
import { displayFieldValue } from '#shared/utils/field-value'

definePageMeta({ layout: 'admin' })

const route = useRoute('admin-submissions-id')
const api = useApi()
const notify = useNotify()
const format = useFormat()
const { settings } = useSiteSettings()

const { data: submission, error } = await useAsyncData(`admin-submission-${route.params.id}`, () => api<SubmissionDetail>(`/api/admin/submissions/${route.params.id}`))
if (error.value) throw createError({ statusCode: error.value.statusCode ?? 404, message: 'Submission not found.' })

useSeoMeta({ title: () => submission.value?.name || 'Submission' })

const state = ref({ status: submission.value?.status ?? 'new', note: submission.value?.note ?? '' })
const baseline = ref(JSON.stringify(state.value))
const isDirty = computed(() => JSON.stringify(state.value) !== baseline.value)
const saving = ref(false)
const confirmDelete = ref(false)
useUnsavedGuard(isDirty)

const answers = computed(() => {
  const value = submission.value
  if (!value) return []
  const known = new Set(value.fields.map(field => field.name))
  const defined = value.fields.map(field => ({ label: field.label, value: displayFieldValue(field, value.data[field.name]) }))
  const removed = Object.keys(value.data)
    .filter(key => !known.has(key))
    .map(key => ({ label: key, value: displayFieldValue({ options: [] }, value.data[key]) }))
  return [...defined, ...removed]
})

const phone = computed(() => {
  const value = submission.value
  const field = value?.fields.find(entry => entry.type === 'tel')
  const raw = field ? String(value?.data[field.name] ?? '') : ''
  const digits = raw.replace(/[^\d]/g, '').replace(/^0/, '62')
  return digits.length >= 8 ? digits : ''
})

const replyLink = computed(() => {
  const value = submission.value
  if (!value?.email) return null
  const subject = `Re: your ${value.formName.toLowerCase()} request${settings.value?.siteName ? ` to ${settings.value.siteName}` : ''}`
  return `mailto:${value.email}?subject=${encodeURIComponent(subject)}`
})

const meta = computed(() => {
  const value = submission.value
  if (!value) return []
  return [
    { label: 'Received', value: format.dateTime(value.createdAt) },
    { label: 'Form', value: value.formName },
    { label: 'Picked service', value: value.serviceSlug },
    { label: 'Picked plan', value: value.planSlug },
    { label: 'Sent from', value: value.sourcePath },
    { label: 'Browser', value: value.userAgent },
  ].filter(row => row.value)
})

async function save() {
  saving.value = true
  try {
    submission.value = await api<SubmissionDetail>(`/api/admin/submissions/${route.params.id}`, { method: 'PUT', body: state.value })
    baseline.value = JSON.stringify(state.value)
    await refreshNuxtData(SUBMISSION_COUNTS_KEY)
    notify.success('Submission updated')
  }
  catch (err) {
    notify.error(err, 'Not saved')
  }
  finally {
    saving.value = false
  }
}

async function remove() {
  try {
    await api('/api/admin/submissions', { method: 'DELETE', body: { ids: [route.params.id] } })
    baseline.value = JSON.stringify(state.value)
    await refreshNuxtData(SUBMISSION_COUNTS_KEY)
    notify.success('Submission deleted')
    await navigateTo('/admin/submissions')
  }
  catch (err) {
    notify.error(err)
  }
}

function setStatus(value: SubmissionStatus) {
  state.value.status = value
}
</script>

<template>
  <AdminPanel
    v-if="submission"
    id="submission"
    :title="submission.name || submission.email || 'Submission'"
  >
    <template #actions>
      <UButton
        icon="i-lucide-trash-2"
        color="neutral"
        variant="ghost"
        aria-label="Delete submission"
        @click="confirmDelete = true"
      />
    </template>

    <div class="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div class="space-y-6">
        <div class="flex flex-wrap gap-2">
          <UButton
            v-if="replyLink"
            :href="replyLink"
            external
            icon="i-lucide-reply"
            label="Reply by email"
          />
          <UButton
            v-if="phone"
            :href="`https://wa.me/${phone}`"
            target="_blank"
            external
            icon="i-simple-icons-whatsapp"
            label="WhatsApp"
            color="neutral"
            variant="outline"
          />
        </div>

        <UPageCard variant="subtle">
          <dl class="divide-y divide-default">
            <div
              v-for="answer in answers"
              :key="answer.label"
              class="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"
            >
              <dt class="text-sm text-muted">
                {{ answer.label }}
              </dt>
              <dd class="text-sm break-words whitespace-pre-line text-highlighted">
                {{ answer.value || '—' }}
              </dd>
            </div>
          </dl>
        </UPageCard>
      </div>

      <aside class="space-y-6">
        <UPageCard
          title="Follow-up"
          variant="subtle"
        >
          <div class="space-y-4">
            <UFormField label="Status">
              <USelect
                :model-value="state.status"
                :items="SUBMISSION_STATUS_ITEMS"
                class="w-full"
                @update:model-value="value => setStatus(value as SubmissionStatus)"
              />
            </UFormField>
            <UFormField
              label="Internal note"
              help="Only visible to admins."
            >
              <UTextarea
                v-model="state.note"
                :rows="4"
                :maxlength="2000"
                autoresize
                class="w-full"
              />
            </UFormField>
            <UButton
              label="Save"
              :loading="saving"
              :disabled="!isDirty"
              @click="save"
            />
          </div>
        </UPageCard>

        <dl class="space-y-2 text-sm">
          <div
            v-for="row in meta"
            :key="row.label"
          >
            <dt class="text-muted">
              {{ row.label }}
            </dt>
            <dd class="break-words text-default">
              {{ row.value }}
            </dd>
          </div>
        </dl>
      </aside>
    </div>

    <ConfirmDialog
      :open="confirmDelete"
      title="Delete this submission?"
      description="It cannot be recovered."
      @confirm="remove"
      @cancel="confirmDelete = false"
    />
  </AdminPanel>
</template>
