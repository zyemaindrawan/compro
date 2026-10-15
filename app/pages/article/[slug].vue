<script setup lang="ts">
import type { ArticlePageData } from '#shared/types/models'

const route = useRoute('article-slug')
const previewId = computed(() => (typeof route.query.preview === 'string' ? route.query.preview : null))

const { data, error } = await useFetch<ArticlePageData>(() => previewId.value
  ? `/api/admin/articles/${previewId.value}/preview`
  : `/api/public/articles/${route.params.slug}`)

if (error.value || !data.value) {
  throw pageError(error.value, 'Article not found')
}

const article = computed(() => data.value!.article)
const related = computed(() => data.value!.related)
const format = useFormat()
const siteUrl = useSiteConfig().url.replace(/\/$/, '')
const url = computed(() => `${siteUrl}/article/${article.value.slug}`)
const primaryCategory = computed(() => article.value.categories[0])

usePageSeo(() => ({
  title: article.value.seo.metaTitle || article.value.title,
  description: article.value.seo.metaDescription || article.value.excerpt,
  image: article.value.seo.ogImage ?? article.value.cover,
  keywords: article.value.seo.metaKeywords,
  canonical: article.value.seo.canonicalUrl || undefined,
  noindex: article.value.seo.noindex || Boolean(previewId.value),
  type: 'article',
  publishedTime: article.value.publishedAt,
  modifiedTime: article.value.updatedAt,
  section: primaryCategory.value?.name,
}))

useSchemaOrg([
  defineArticle({
    headline: article.value.title,
    description: article.value.excerpt,
    datePublished: article.value.publishedAt ?? article.value.updatedAt,
    dateModified: article.value.updatedAt,
    ...(article.value.cover ? { image: article.value.cover.url } : {}),
    ...(article.value.author ? { author: { name: article.value.author.displayName } } : {}),
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Articles', item: '/articles' },
      ...(primaryCategory.value ? [{ name: primaryCategory.value.name, item: `/articles/category/${primaryCategory.value.slug}` }] : []),
      { name: article.value.title },
    ],
  }),
])
</script>

<template>
  <div>
    <UAlert
      v-if="previewId"
      title="Preview"
      description="Only signed-in admins can see this page until it is published."
      icon="i-lucide-eye"
      color="warning"
      variant="subtle"
      :ui="{ root: 'rounded-none justify-center' }"
    />

    <article class="py-12 sm:py-16">
      <UContainer class="max-w-3xl space-y-6">
        <UBreadcrumb
          :items="[
            { label: 'Articles', to: '/articles' },
            ...(primaryCategory ? [{ label: primaryCategory.name, to: `/articles/category/${primaryCategory.slug}` }] : []),
          ]"
        />
        <h1 class="font-display text-4xl font-bold text-balance text-highlighted sm:text-5xl">
          {{ article.title }}
        </h1>
        <p
          v-if="article.excerpt"
          class="text-xl text-pretty text-muted"
        >
          {{ article.excerpt }}
        </p>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span
            v-if="article.author"
            class="font-medium text-default"
          >{{ article.author.displayName }}</span>
          <span
            v-if="article.author"
            aria-hidden="true"
          >·</span>
          <time
            v-if="article.publishedAt"
            :datetime="article.publishedAt"
          >{{ format.date(article.publishedAt) }}</time>
          <span aria-hidden="true">·</span>
          <span>{{ article.readingMinutes }} min read</span>
        </div>
      </UContainer>

      <UContainer
        v-if="article.cover"
        class="mt-10 max-w-5xl"
      >
        <SmartImage
          :media="article.cover"
          :alt="article.cover.alt || article.title"
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          class="aspect-[16/9] w-full rounded-lg border border-default object-cover"
        />
      </UContainer>

      <UContainer class="mt-10 max-w-3xl space-y-12">
        <div
          class="article-body prose max-w-none prose-lg"
          v-html="article.contentHtml"
        />

        <div class="flex flex-col gap-6 border-t border-default pt-8">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <ul
              v-if="article.categories.length"
              class="flex flex-wrap gap-2"
            >
              <li
                v-for="category in article.categories"
                :key="category.slug"
              >
                <UBadge
                  :label="category.name"
                  color="neutral"
                  variant="outline"
                  class="hover:bg-elevated"
                >
                  <NuxtLink :to="`/articles/category/${category.slug}`">{{ category.name }}</NuxtLink>
                </UBadge>
              </li>
            </ul>
            <ShareLinks
              :title="article.title"
              :url="url"
            />
          </div>
          <AuthorBox
            v-if="article.author"
            :author="article.author"
          />
        </div>
      </UContainer>
    </article>

    <section
      v-if="related.length"
      class="border-t border-default bg-muted/40 py-14 sm:py-20"
      aria-labelledby="read-more"
    >
      <UContainer class="space-y-8">
        <h2
          id="read-more"
          class="font-display text-2xl font-bold text-highlighted"
        >
          Read more
        </h2>
        <ArticleGrid :articles="related" />
      </UContainer>
    </section>
  </div>
</template>
