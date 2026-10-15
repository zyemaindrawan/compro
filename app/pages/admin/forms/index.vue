<script setup lang="ts">
import type { AdminForm } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Forms' })

const api = useApi()
const { data: forms, status } = useAsyncData('admin-forms', () => api<AdminForm[]>('/api/admin/forms'), { default: () => [] })

const usedOn: Record<string, string> = {
  contact: '/contact',
  quotation: '/quote',
}
</script>

<template>
  <AdminPanel
    id="forms"
    title="Forms"
  >
    <div class="mx-auto w-full max-w-3xl space-y-3">
      <p class="text-sm text-muted">
        Edit the fields, button text and who gets an email. Forms can also be placed on any page with a form block.
      </p>
      <div
        v-if="status === 'pending' && !forms.length"
        class="space-y-2"
      >
        <USkeleton
          v-for="n in 2"
          :key="n"
          class="h-20"
        />
      </div>
      <ul class="divide-y divide-default rounded-lg border border-default">
        <li
          v-for="form in forms"
          :key="form.id"
          class="flex flex-wrap items-center gap-3 bg-default px-4 py-4"
        >
          <UIcon
            name="i-lucide-clipboard-list"
            class="size-5 shrink-0 text-muted"
          />
          <div class="min-w-0 flex-1">
            <NuxtLink
              :to="`/admin/forms/${form.id}`"
              class="block truncate font-medium text-highlighted hover:text-primary"
            >
              {{ form.name }}
            </NuxtLink>
            <p class="truncate text-xs text-muted">
              {{ form.fields.length }} fields<template v-if="usedOn[form.key]">
                · {{ usedOn[form.key] }}
              </template>
              · {{ form.notifyEmails.length ? form.notifyEmails.join(', ') : 'Site email' }}
            </p>
          </div>
          <UButton
            :to="`/admin/submissions?form=${form.key}`"
            :label="`${form.submissionCount} submissions`"
            color="neutral"
            variant="ghost"
            size="sm"
          />
          <UButton
            :to="`/admin/forms/${form.id}`"
            label="Edit"
            icon="i-lucide-pencil"
            color="neutral"
            variant="outline"
            size="sm"
          />
        </li>
      </ul>
    </div>
  </AdminPanel>
</template>
