import type { H3Event } from 'h3'
import { z } from 'zod'
import { pricingSchema } from '#shared/schemas/page.schema'
import { pricingModel } from '../models/pricing.model'
import { cacheService } from '../services/cache.service'

const serviceParams = z.object({ serviceId: z.uuid('Invalid id') })

async function publicList() {
  const groups = await pricingModel.groups(useAnonDb(), { activeOnly: true })
  return groups.filter(group => group.plans.length)
}

async function adminShow(event: H3Event) {
  const { serviceId } = validateParams(event, serviceParams)
  const [group] = await pricingModel.groups(useDb(event), { serviceId, activeOnly: false })
  if (!group) fail(404, 'Service not found.')
  return group
}

async function save(event: H3Event) {
  await requireAdmin(event)
  const { serviceId } = validateParams(event, serviceParams)
  const input = await validateBody(event, pricingSchema)
  const db = useDb(event)

  const planIds = new Map(input.plans.map(plan => [plan.key, plan.id ?? crypto.randomUUID()]))
  const featureIds = new Map(input.features.map(feature => [feature.key, feature.id ?? crypto.randomUUID()]))

  const plans = input.plans.map((plan, position) => ({
    id: planIds.get(plan.key)!,
    service_id: serviceId,
    name: plan.name,
    slug: plan.slug,
    price: plan.price,
    price_suffix: plan.price_suffix,
    description: plan.description,
    cta_label: plan.cta_label,
    is_popular: plan.is_popular,
    position,
  }))
  const features = input.features.map((feature, position) => ({
    id: featureIds.get(feature.key)!,
    service_id: serviceId,
    label: feature.label,
    group_label: feature.group_label,
    position,
  }))
  const cells = input.cells.flatMap((cell) => {
    const planId = planIds.get(cell.plan_key)
    const featureId = featureIds.get(cell.feature_key)
    return planId && featureId
      ? [{ plan_id: planId, feature_id: featureId, value_type: cell.value_type, value_text: cell.value_text }]
      : []
  })

  await pricingModel.replace(db, serviceId, plans, features, cells)
  await cacheService.purgePublic()
  const [group] = await pricingModel.groups(db, { serviceId, activeOnly: false })
  return group
}

export const pricingController = {
  publicList,
  adminShow,
  save,
}
