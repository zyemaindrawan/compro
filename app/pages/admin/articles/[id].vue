<script setup lang="ts">
import type { AdminArticle } from '#shared/types/models'

definePageMeta({ layout: 'admin' })

const route = useRoute('admin-articles-id')
const api = useApi()
const { data: article, error } = await useAsyncData(`admin-article-${route.params.id}`, () =>
  api<AdminArticle>(`/api/admin/articles/${route.params.id}`))

if (error.value) throw createError({ statusCode: error.value.statusCode ?? 404, message: 'Article not found.' })

useSeoMeta({ title: () => article.value?.title || 'Edit article' })
</script>

<template>
  <ArticleForm
    v-if="article"
    :key="article.id"
    :article="article"
  />
</template>
