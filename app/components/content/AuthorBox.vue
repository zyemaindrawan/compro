<script setup lang="ts">
import type { ArticleAuthor } from '#shared/types/models'

defineProps<{ author: ArticleAuthor }>()
</script>

<template>
  <aside
    class="flex gap-4 rounded-lg border border-default p-5"
    aria-label="About the author"
  >
    <UAvatar
      :src="author.avatar?.variants[0]?.url ?? author.avatar?.url"
      :alt="author.displayName"
      size="xl"
      class="shrink-0"
      :ui="{ fallback: 'text-highlighted' }"
    />
    <div class="space-y-1">
      <p class="text-xs text-muted">
        Written by
      </p>
      <p class="font-semibold text-highlighted">
        {{ author.displayName }}
      </p>
      <p
        v-if="author.bio"
        class="text-sm text-muted"
      >
        {{ author.bio }}
      </p>
    </div>
  </aside>
</template>
