<script setup lang="ts">
import type { PricingGroup } from '#shared/types/models'

const props = defineProps<{
  groups: PricingGroup[]
  initialService?: string
}>()

const format = useFormat()
const activeSlug = ref(props.groups.find(group => group.service.slug === props.initialService)?.service.slug ?? props.groups[0]?.service.slug)
const active = computed(() => props.groups.find(group => group.service.slug === activeSlug.value) ?? props.groups[0])
const mobilePlan = ref(0)
const tabs = useTemplateRef<HTMLButtonElement[]>('tabs')

watch(activeSlug, () => {
  mobilePlan.value = Math.max(0, active.value?.plans.findIndex(plan => plan.isPopular) ?? 0)
}, { immediate: true })

const sections = computed(() => {
  const result: { group: string, features: PricingGroup['features'] }[] = []
  for (const feature of active.value?.features ?? []) {
    const last = result.at(-1)
    if (last && last.group === feature.group) last.features.push(feature)
    else result.push({ group: feature.group, features: [feature] })
  }
  return result
})

function quoteLink(planSlug: string) {
  return { path: '/quote', query: { service: active.value?.service.slug, plan: planSlug } }
}

function onTabKey(event: KeyboardEvent, index: number) {
  const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!offset) return
  const next = (index + offset + props.groups.length) % props.groups.length
  activeSlug.value = props.groups[next]?.service.slug
  tabs.value?.[next]?.focus()
}
</script>

<template>
  <div
    v-if="active"
    class="space-y-10"
  >
    <div
      v-if="groups.length > 1"
      role="tablist"
      aria-label="Services"
      class="-mx-4 flex gap-1 overflow-x-auto px-4"
    >
      <button
        v-for="(group, index) in groups"
        :id="`pricing-tab-${group.service.slug}`"
        ref="tabs"
        :key="group.service.id"
        type="button"
        role="tab"
        :aria-selected="group.service.slug === active.service.slug"
        :aria-controls="`pricing-panel-${group.service.slug}`"
        :tabindex="group.service.slug === active.service.slug ? 0 : -1"
        class="shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
        :class="group.service.slug === active.service.slug ? 'border-transparent bg-inverted text-inverted' : 'border-default text-muted hover:text-highlighted'"
        @click="activeSlug = group.service.slug"
        @keydown="onTabKey($event, index)"
      >
        {{ group.service.name }}
      </button>
    </div>

    <div
      :id="`pricing-panel-${active.service.slug}`"
      role="tabpanel"
      :aria-labelledby="groups.length > 1 ? `pricing-tab-${active.service.slug}` : undefined"
      class="space-y-12"
    >
      <h2 class="sr-only">
        {{ active.service.name }} plans
      </h2>
      <ul class="grid gap-4 md:grid-cols-3">
        <li
          v-for="plan in active.plans"
          :key="plan.id"
          class="relative flex flex-col gap-6 rounded-lg border bg-default p-6"
          :class="plan.isPopular ? 'border-primary ring-1 ring-primary' : 'border-default'"
        >
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-display text-xl font-semibold text-highlighted">
                {{ plan.name }}
              </h3>
              <span
                v-if="plan.isPopular"
                class="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-1 text-[10px]/3 font-medium text-primary ring ring-primary/25 ring-inset"
              >Most chosen</span>
            </div>
            <p class="text-sm text-muted">
              {{ plan.description }}
            </p>
          </div>
          <p class="flex flex-wrap items-baseline gap-x-2">
            <span class="font-display text-3xl font-bold text-highlighted tabular-nums">{{ format.currency(plan.price) }}</span>
            <span class="text-sm text-muted">{{ plan.priceSuffix }}</span>
          </p>
          <BaseButton
            :to="quoteLink(plan.slug)"
            :label="plan.ctaLabel"
            :color="plan.isPopular ? 'primary' : 'neutral'"
            :variant="plan.isPopular ? 'solid' : 'outline'"
            block
            class="mt-auto"
          />
        </li>
      </ul>

      <div
        v-if="active.features.length"
        class="space-y-4 [contain-intrinsic-size:auto_800px] [content-visibility:auto]"
      >
        <h3 class="font-display text-xl font-semibold text-highlighted">
          Compare plans
        </h3>

        <div class="hidden overflow-x-auto md:block">
          <table class="w-full border-collapse text-sm">
            <caption class="sr-only">
              Features included in each {{ active.service.name }} plan
            </caption>
            <thead>
              <tr class="border-b border-default">
                <th
                  scope="col"
                  class="w-2/5 py-3 text-left font-medium text-muted"
                >
                  Feature
                </th>
                <th
                  v-for="plan in active.plans"
                  :key="plan.id"
                  scope="col"
                  class="py-3 text-left font-semibold text-highlighted"
                >
                  {{ plan.name }}
                </th>
              </tr>
            </thead>
            <tbody
              v-for="section in sections"
              :key="section.group"
            >
              <tr v-if="section.group">
                <th
                  :colspan="active.plans.length + 1"
                  scope="colgroup"
                  class="pt-6 pb-2 text-left text-xs font-semibold tracking-wide text-muted uppercase"
                >
                  {{ section.group }}
                </th>
              </tr>
              <tr
                v-for="feature in section.features"
                :key="feature.id"
                class="border-b border-default"
              >
                <th
                  scope="row"
                  class="py-3 pe-4 text-left font-normal text-default"
                >
                  {{ feature.label }}
                </th>
                <td
                  v-for="plan in active.plans"
                  :key="plan.id"
                  class="py-3 pe-4"
                >
                  <PricingCellValue :cell="feature.cells[plan.id]" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="space-y-4 md:hidden">
          <div
            class="flex gap-1 rounded-lg bg-elevated p-1"
            role="radiogroup"
            aria-label="Plan to compare"
          >
            <button
              v-for="(plan, index) in active.plans"
              :key="plan.id"
              type="button"
              role="radio"
              :aria-checked="mobilePlan === index"
              class="flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors"
              :class="mobilePlan === index ? 'bg-default text-highlighted shadow-sm' : 'text-default'"
              @click="mobilePlan = index"
            >
              {{ plan.name }}
            </button>
          </div>
          <div
            v-for="section in sections"
            :key="section.group"
          >
            <p
              v-if="section.group"
              class="pt-2 pb-2 text-xs font-semibold tracking-wide text-muted uppercase"
            >
              {{ section.group }}
            </p>
            <dl class="divide-y divide-default">
              <div
                v-for="feature in section.features"
                :key="feature.id"
                class="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <dt>{{ feature.label }}</dt>
                <dd>
                  <PricingCellValue :cell="feature.cells[active.plans[mobilePlan]?.id ?? '']" />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
