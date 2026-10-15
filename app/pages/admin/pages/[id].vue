<script setup lang="ts">
import type { AdminPage } from '#shared/types/models'

definePageMeta({ layout: 'admin' })

const route = useRoute('admin-pages-id')
const api = useApi()
const { data: page, error } = await useAsyncData(`admin-page-${route.params.id}`, () => api<AdminPage>(`/api/admin/pages/${route.params.id}`))
if (error.value) throw createError({ statusCode: error.value.statusCode ?? 404, message: 'Page not found.' })

useSeoMeta({ title: () => page.value?.title || 'Edit page' })
</script>

<template>
  <PageForm
    v-if="page"
    :key="page.id"
    :page="page"
  />
</template>
