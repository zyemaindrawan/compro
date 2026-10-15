<script setup lang="ts">
import type { ArticleSummary, CategorySummary, Paginated } from '#shared/types/models'

const route = useRoute()
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))

const [{ data: articles }, { data: categories }] = await Promise.all([
  useFetch<Paginated<ArticleSummary>>('/api/public/articles', {
    query: computed(() => ({ page: page.value, q: q.value || undefined, perPage: 9 })),
  }),
  useFetch<CategorySummary[]>('/api/public/categories', { key: 'public-categories', default: () => [] }),
])

if (page.value > 1 && !articles.value?.items.length) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const heading = computed(() => (q.value ? `Results for “${q.value}”` : 'Articles'))

usePageSeo(() => ({
  title: q.value ? `Search: ${q.value}` : page.value > 1 ? `Articles, page ${page.value}` : 'Articles',
  description: 'Notes from client work: architecture decisions, Android apps, cloud costs and the tools we use.',
  noindex: Boolean(q.value),
}))

useSchemaOrg([defineWebPage({ '@type': 'CollectionPage' })])
useItemListSchema(
  (articles.value?.items ?? []).map(article => ({ name: article.title, url: `/article/${article.slug}` })),
  { offset: (page.value - 1) * (articles.value?.perPage ?? 0), name: 'Articles' },
)
</script>

<template>
  <UContainer class="space-y-10 py-14 sm:py-20">
    <header class="space-y-6">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-2xl space-y-3">
          <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
            {{ heading }}
          </h1>
          <p
            v-if="!q"
            class="text-lg text-muted"
          >
            Notes from client work: architecture decisions, Android apps, cloud costs and the tools we use.
          </p>
          <p
            v-else
            class="text-muted"
          >
            {{ articles?.total ?? 0 }} {{ articles?.total === 1 ? 'article' : 'articles' }} found.
            <ULink
              to="/articles"
              class="text-primary underline-offset-4 hover:underline"
            >Clear search</ULink>
          </p>
        </div>
        <ArticleSearch />
      </div>
      <CategoryNav
        v-if="!q && categories.length"
        :categories="categories"
      />
    </header>

    <ArticleGrid
      v-if="articles?.items.length"
      :articles="articles.items"
      :feature-first="!q && page === 1"
      heading-level="h2"
    />

    <EmptyState
      v-else
      icon="i-lucide-search-x"
      :title="q ? 'Nothing matches that search' : 'No articles yet'"
      :description="q ? 'Try fewer or different words, or browse a category below.' : 'The first articles are on their way.'"
    >
      <CategoryNav
        v-if="q && categories.length"
        :categories="categories"
        class="max-w-full"
      />
    </EmptyState>

    <AppPagination
      v-if="articles"
      :page="articles.page"
      :total="articles.total"
      :per-page="articles.perPage"
    />
  </UContainer>
</template>
