<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { pricingSchema, type PricingCellInput, type PricingFeatureInput, type PricingInput, type PricingPlanInput } from '#shared/schemas/page.schema'
import type { AdminService, PricingGroup } from '#shared/types/models'

definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Pricing' })

const route = useRoute()
const router = useRouter()
const api = useApi()
const notify = useNotify()
const format = useFormat()
const form = useTemplateRef('form')

const { data: services } = await useAsyncData('admin-services', () => api<AdminService[]>('/api/admin/services'), { default: () => [] })
const serviceId = ref(typeof route.query.service === 'string' ? route.query.service : services.value[0]?.id ?? '')
const saving = ref(false)

const { data: group, status } = useAsyncData(
  () => `admin-pricing-${serviceId.value}`,
  () => (serviceId.value ? api<PricingGroup>(`/api/admin/pricing/${serviceId.value}`) : Promise.resolve(null)),
  { watch: [serviceId] },
)

watch(serviceId, (id) => {
  router.replace({ query: { ...route.query, service: id } })
})

function toState(value: PricingGroup | null | undefined): PricingInput {
  if (!value) return { plans: [], features: [], cells: [] }
  return {
    plans: value.plans.map(plan => ({
      id: plan.id,
      key: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      price_suffix: plan.priceSuffix,
      description: plan.description,
      cta_label: plan.ctaLabel,
      is_popular: plan.isPopular,
    })),
    features: value.features.map(feature => ({ id: feature.id, key: feature.id, label: feature.label, group_label: feature.group })),
    cells: value.features.flatMap(feature => value.plans.map(plan => ({
      plan_key: plan.id,
      feature_key: feature.id,
      value_type: feature.cells[plan.id]?.type ?? 'cross',
      value_text: feature.cells[plan.id]?.text ?? '',
    }))),
  }
}

const state = ref<PricingInput>(toState(group.value))
const baseline = ref(JSON.stringify(state.value))
const isDirty = computed(() => JSON.stringify(state.value) !== baseline.value)
useUnsavedGuard(isDirty)

watch(group, (value) => {
  state.value = toState(value)
  baseline.value = JSON.stringify(state.value)
})

const cellIndex = computed(() => new Map(state.value.cells.map(cell => [`${cell.plan_key}:${cell.feature_key}`, cell])))

watch(
  () => [state.value.plans.map(plan => plan.key), state.value.features.map(feature => feature.key)],
  () => {
    for (const plan of state.value.plans) {
      for (const feature of state.value.features) {
        if (!cellIndex.value.has(`${plan.key}:${feature.key}`)) {
          state.value.cells.push({ plan_key: plan.key, feature_key: feature.key, value_type: 'cross', value_text: '' })
        }
      }
    }
  },
  { immediate: true, deep: true },
)

function cellFor(plan: PricingPlanInput, feature: PricingFeatureInput): PricingCellInput | undefined {
  return cellIndex.value.get(`${plan.key}:${feature.key}`)
}

function addPlan() {
  const key = crypto.randomUUID()
  const index = state.value.plans.length + 1
  state.value.plans.push({ key, name: `Plan ${index}`, slug: `plan-${index}`, price: 0, price_suffix: '/ project', description: '', cta_label: 'Get a quote', is_popular: false })
}

function removePlan(key: string) {
  state.value.plans = state.value.plans.filter(plan => plan.key !== key)
  state.value.cells = state.value.cells.filter(cell => cell.plan_key !== key)
}

function movePlan(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= state.value.plans.length) return
  const plans = [...state.value.plans]
  const [plan] = plans.splice(index, 1)
  if (plan) plans.splice(target, 0, plan)
  state.value.plans = plans
}

function setPopular(key: string, value: boolean) {
  state.value.plans.forEach((plan) => {
    plan.is_popular = value && plan.key === key
  })
}

function addFeature() {
  const last = state.value.features.at(-1)
  state.value.features.push({ key: crypto.randomUUID(), label: '', group_label: last?.group_label ?? '' })
}

function removeFeature(key: string) {
  state.value.features = state.value.features.filter(feature => feature.key !== key)
  state.value.cells = state.value.cells.filter(cell => cell.feature_key !== key)
}

function moveFeature(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= state.value.features.length) return
  const features = [...state.value.features]
  const [feature] = features.splice(index, 1)
  if (feature) features.splice(target, 0, feature)
  state.value.features = features
}

async function onSubmit(event: FormSubmitEvent<PricingInput>) {
  saving.value = true
  try {
    const live = new Set(event.data.plans.map(plan => plan.key))
    const liveFeatures = new Set(event.data.features.map(feature => feature.key))
    group.value = await api<PricingGroup>(`/api/admin/pricing/${serviceId.value}`, {
      method: 'PUT',
      body: { ...event.data, cells: event.data.cells.filter(cell => live.has(cell.plan_key) && liveFeatures.has(cell.feature_key)) },
    })
    notify.success('Pricing saved')
  }
  catch (error) {
    const fields = apiFieldErrors(error)
    if (fields.length) form.value?.setErrors(fields)
    notify.error(error, 'Pricing not saved')
  }
  finally {
    saving.value = false
  }
}

const serviceOptions = computed(() => services.value.map(service => ({ label: service.name, value: service.id })))

defineShortcuts({
  meta_s: () => form.value?.submit(),
})
</script>

<template>
  <AdminPanel
    id="pricing"
    title="Pricing"
  >
    <template #actions>
      <UBadge
        v-if="isDirty"
        label="Unsaved"
        color="warning"
        variant="subtle"
        class="hidden md:inline-flex"
      />
      <UButton
        label="Save"
        icon="i-lucide-save"
        :loading="saving"
        :disabled="!isDirty"
        @click="form?.submit()"
      />
    </template>

    <div class="space-y-6 pb-16">
      <UFormField label="Service">
        <USelect
          v-model="serviceId"
          :items="serviceOptions"
          class="w-full sm:w-72"
        />
      </UFormField>

      <div
        v-if="status === 'pending' && !group"
        class="space-y-2"
      >
        <USkeleton class="h-48" />
      </div>

      <UForm
        v-else
        ref="form"
        :schema="pricingSchema"
        :state="state"
        class="space-y-8"
        @submit="onSubmit"
      >
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-highlighted">
              Plans
            </h2>
            <UButton
              label="Add plan"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              :disabled="state.plans.length >= 6"
              @click="addPlan"
            />
          </div>
          <UFormField name="plans" />
          <p
            v-if="!state.plans.length"
            class="text-sm text-muted"
          >
            No plans yet. The pricing section stays hidden for this service until you add one.
          </p>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <UPageCard
              v-for="(plan, index) in state.plans"
              :key="plan.key"
              variant="subtle"
              :class="plan.is_popular ? 'ring-1 ring-primary' : ''"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-muted">Plan {{ index + 1 }}</span>
                <div class="flex">
                  <UButton
                    icon="i-lucide-arrow-left"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Move left"
                    :disabled="index === 0"
                    @click="movePlan(index, -1)"
                  />
                  <UButton
                    icon="i-lucide-arrow-right"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Move right"
                    :disabled="index === state.plans.length - 1"
                    @click="movePlan(index, 1)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    aria-label="Delete plan"
                    @click="removePlan(plan.key)"
                  />
                </div>
              </div>
              <UFormField
                label="Name"
                :name="`plans.${index}.name`"
              >
                <UInput
                  v-model="plan.name"
                  class="w-full"
                />
              </UFormField>
              <SlugInput
                v-model="plan.slug"
                :source="plan.name"
                :name="`plans.${index}.slug`"
                prefix="?plan="
                :auto-sync="!plan.id"
              />
              <div class="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
                <UFormField
                  label="Price (IDR)"
                  :name="`plans.${index}.price`"
                  :help="format.currency(plan.price)"
                >
                  <UInputNumber
                    v-model="plan.price"
                    :min="0"
                    :step="500000"
                    :format-options="{ maximumFractionDigits: 0 }"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Suffix"
                  :name="`plans.${index}.price_suffix`"
                >
                  <UInput
                    v-model="plan.price_suffix"
                    placeholder="/ month"
                    class="w-full"
                  />
                </UFormField>
              </div>
              <UFormField
                label="Description"
                :name="`plans.${index}.description`"
              >
                <UTextarea
                  v-model="plan.description"
                  :rows="2"
                  :maxlength="240"
                  autoresize
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Button text"
                :name="`plans.${index}.cta_label`"
              >
                <UInput
                  v-model="plan.cta_label"
                  class="w-full"
                />
              </UFormField>
              <USwitch
                :model-value="plan.is_popular"
                label="Highlight as most chosen"
                @update:model-value="value => setPopular(plan.key, value)"
              />
            </UPageCard>
          </div>
        </section>

        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-highlighted">
              Comparison table
            </h2>
            <UButton
              label="Add feature"
              icon="i-lucide-plus"
              color="neutral"
              variant="outline"
              size="sm"
              :disabled="!state.plans.length"
              @click="addFeature"
            />
          </div>
          <p class="text-sm text-muted">
            Click a cell icon to switch between included, not included and custom text.
          </p>
          <div
            v-if="state.features.length"
            class="overflow-x-auto rounded-lg border border-default"
          >
            <table class="w-full min-w-[40rem] text-sm">
              <thead class="bg-elevated/50 text-xs text-muted">
                <tr>
                  <th class="w-10" />
                  <th class="px-3 py-2 text-left font-medium">
                    Feature
                  </th>
                  <th class="px-3 py-2 text-left font-medium">
                    Group
                  </th>
                  <th
                    v-for="plan in state.plans"
                    :key="plan.key"
                    class="px-3 py-2 text-left font-medium"
                  >
                    {{ plan.name }}
                  </th>
                  <th class="w-10" />
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr
                  v-for="(feature, index) in state.features"
                  :key="feature.key"
                  class="align-top"
                >
                  <td class="py-2 ps-2">
                    <div class="flex flex-col">
                      <UButton
                        icon="i-lucide-chevron-up"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        aria-label="Move up"
                        :disabled="index === 0"
                        @click="moveFeature(index, -1)"
                      />
                      <UButton
                        icon="i-lucide-chevron-down"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        aria-label="Move down"
                        :disabled="index === state.features.length - 1"
                        @click="moveFeature(index, 1)"
                      />
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <UFormField :name="`features.${index}.label`">
                      <UInput
                        v-model="feature.label"
                        placeholder="Feature"
                        aria-label="Feature"
                        class="w-full min-w-40"
                      />
                    </UFormField>
                  </td>
                  <td class="px-3 py-2">
                    <UInput
                      v-model="feature.group_label"
                      placeholder="Optional"
                      aria-label="Group"
                      class="w-full min-w-28"
                    />
                  </td>
                  <td
                    v-for="plan in state.plans"
                    :key="plan.key"
                    class="px-3 py-2"
                  >
                    <PricingCellEditor
                      v-if="cellFor(plan, feature)"
                      :cell="cellFor(plan, feature)!"
                      :label="`${feature.label || 'feature'} for ${plan.name}`"
                    />
                  </td>
                  <td class="py-2 pe-2">
                    <UButton
                      icon="i-lucide-x"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      aria-label="Delete feature"
                      @click="removeFeature(feature.key)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </UForm>
    </div>
  </AdminPanel>
</template>
