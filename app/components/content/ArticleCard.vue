<script setup lang="ts">
import type { ArticleSummary } from '#shared/types/models'

const props = withDefaults(defineProps<{
  article: ArticleSummary
  featured?: boolean
  headingLevel?: 'h2' | 'h3'
  priority?: boolean
}>(), {
  featured: false,
  headingLevel: 'h3',
  priority: false,
})

const format = useFormat()
const href = computed(() => `/article/${props.article.slug}`)
</script>

<template>
  <article
    class="group relative flex flex-col gap-4"
    :class="featured ? 'md:grid md:grid-cols-2 md:items-center md:gap-10' : ''"
  >
    <NuxtLink
      :to="href"
      tabindex="-1"
      aria-hidden="true"
      class="block overflow-hidden rounded-lg border border-default bg-elevated"
    >
      <SmartImage
        v-if="article.cover"
        :media="article.cover"
        :alt="article.cover.alt || article.title"
        :priority="priority"
        :sizes="featured ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'"
        class="aspect-[16/9] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.015]"
      />
      <div
        v-else
        class="flex aspect-[16/9] items-end bg-muted p-5"
      >
        <span class="font-display text-2xl font-semibold text-dimmed">{{ article.categories[0]?.name ?? 'Article' }}</span>
      </div>
    </NuxtLink>

    <div class="flex flex-col gap-3">
      <ul
        v-if="article.categories.length"
        class="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium"
      >
        <li
          v-for="category in article.categories"
          :key="category.slug"
        >
          <NuxtLink
            :to="`/articles/category/${category.slug}`"
            class="relative z-10 text-primary hover:underline"
          >
            {{ category.name }}
          </NuxtLink>
        </li>
      </ul>
      <component
        :is="headingLevel"
        class="font-display font-semibold text-balance text-highlighted"
        :class="featured ? 'text-3xl sm:text-4xl' : 'text-xl'"
      >
        <NuxtLink
          :to="href"
          class="transition-colors group-hover:text-primary"
        >
          {{ article.title }}
        </NuxtLink>
      </component>
      <p
        v-if="article.excerpt"
        class="text-muted"
        :class="featured ? 'text-lg' : 'line-clamp-2 text-sm'"
      >
        {{ article.excerpt }}
      </p>
      <p class="text-xs text-dimmed">
        <time
          v-if="article.publishedAt"
          :datetime="article.publishedAt"
        >{{ format.date(article.publishedAt) }}</time>
        <span aria-hidden="true"> · </span>
        {{ article.readingMinutes }} min read
      </p>
    </div>
  </article>
</template>
