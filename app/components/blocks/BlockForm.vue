<script setup lang="ts">
import type { BlockProps } from '#shared/schemas/block.schema'
import type { BlockData } from '#shared/types/models'

const props = defineProps<{ block: BlockProps<'form'>, data: BlockData }>()

const form = computed(() => props.data.forms[props.block.form_key] ?? null)
</script>

<template>
  <section v-if="form">
    <UContainer class="grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
      <SectionHeader
        :heading="block.heading"
        :intro="block.intro"
      />
      <DynamicForm :form="form" />
    </UContainer>
  </section>
</template>
