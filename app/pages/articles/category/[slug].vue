<script setup lang="ts">
import type { ArticleSummary, CategoryDetail, CategorySummary, Paginated } from '#shared/types/models'

const route = useRoute('articles-category-slug')
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const [{ data: category, error }, { data: articles }, { data: categories }] = await Promise.all([
  useFetch<CategoryDetail>(() => `/api/public/categories/${route.params.slug}`),
  useFetch<Paginated<ArticleSummary>>('/api/public/articles', {
    query: computed(() => ({ category: route.params.slug, page: page.value, perPage: 9 })),
  }),
  useFetch<CategorySummary[]>('/api/public/categories', { key: 'public-categories', default: () => [] }),
])

if (error.value || !category.value) {
  throw pageError(error.value, 'Category not found')
}
if (page.value > 1 && !articles.value?.items.length) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

usePageSeo(() => ({
  title: category.value!.seo.metaTitle || (page.value > 1 ? `${category.value!.name}, page ${page.value}` : category.value!.name),
  description: category.value!.seo.metaDescription || category.value!.description,
  image: category.value!.seo.ogImage,
  keywords: category.value!.seo.metaKeywords,
  canonical: category.value!.seo.canonicalUrl || undefined,
  noindex: category.value!.seo.noindex,
}))

useSchemaOrg([
  defineWebPage({ '@type': 'CollectionPage' }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Articles', item: '/articles' },
      { name: category.value.name, item: `/articles/category/${category.value.slug}` },
    ],
  }),
])
useItemListSchema(
  (articles.value?.items ?? []).map(article => ({ name: article.title, url: `/article/${article.slug}` })),
  { offset: (page.value - 1) * (articles.value?.perPage ?? 0), name: category.value.name },
)
</script>

<template>
  <AppContainer
    v-if="category"
    class="space-y-10 py-14 sm:py-20"
  >
    <header class="space-y-6">
      <AppBreadcrumb :items="[{ label: 'Articles', to: '/articles' }, { label: category.name }]" />
      <div class="max-w-2xl space-y-3">
        <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
          {{ category.name }}
        </h1>
        <p
          v-if="category.description"
          class="text-lg text-muted"
        >
          {{ category.description }}
        </p>
      </div>
      <CategoryNav
        :categories="categories"
        :active="category.slug"
      />
    </header>

    <ArticleGrid
      v-if="articles?.items.length"
      :articles="articles.items"
      heading-level="h2"
    />
    <EmptyState
      v-else
      icon="i-lucide-folder-open"
      title="No articles in this category yet"
      description="Browse all articles instead."
    >
      <BaseButton
        to="/articles"
        label="All articles"
        color="neutral"
        variant="outline"
      />
    </EmptyState>

    <AppPagination
      v-if="articles"
      :page="articles.page"
      :total="articles.total"
      :per-page="articles.perPage"
    />
  </AppContainer>
</template>
