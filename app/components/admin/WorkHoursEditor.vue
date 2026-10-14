<script setup lang="ts">
import type { WorkHour } from '#shared/schemas/settings.schema'
import { WEEKDAY_LABELS } from '#shared/constants'

const model = defineModel<WorkHour[]>({ required: true })
</script>

<template>
  <ul class="divide-y divide-default rounded-lg border border-default">
    <li
      v-for="(entry, index) in model"
      :key="entry.day"
      class="grid grid-cols-[6.5rem_1fr] items-center gap-3 px-3 py-2.5 sm:grid-cols-[8rem_auto_1fr]"
    >
      <span class="text-sm font-medium">{{ WEEKDAY_LABELS[entry.day] }}</span>
      <USwitch
        v-model="entry.closed"
        label="Closed"
        class="justify-self-end sm:justify-self-start"
      />
      <div
        v-if="!entry.closed"
        class="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-self-end"
      >
        <UFormField
          :name="`work_hours.${index}.open`"
          class="flex-1 sm:flex-none"
        >
          <UInput
            v-model="entry.open"
            type="time"
            aria-label="Opens"
            class="w-full sm:w-32"
          />
        </UFormField>
        <span class="text-muted">–</span>
        <UFormField
          :name="`work_hours.${index}.close`"
          class="flex-1 sm:flex-none"
        >
          <UInput
            v-model="entry.close"
            type="time"
            aria-label="Closes"
            class="w-full sm:w-32"
          />
        </UFormField>
      </div>
    </li>
  </ul>
</template>
