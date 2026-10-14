<script setup lang="ts">
import type { AdminForm } from '#shared/types/models'

definePageMeta({ layout: 'admin' })

const route = useRoute('admin-forms-id')
const api = useApi()
const { data: form, error } = await useAsyncData(`admin-form-${route.params.id}`, () => api<AdminForm>(`/api/admin/forms/${route.params.id}`))
if (error.value) throw createError({ statusCode: error.value.statusCode ?? 404, message: 'Form not found.' })

useSeoMeta({ title: () => form.value?.name || 'Edit form' })
</script>

<template>
  <FormBuilder
    v-if="form"
    :key="form.id"
    :form="form"
  />
</template>
