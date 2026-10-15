import type { Db } from '../utils/supabase'
import type { PricingCell, PricingGroup } from '#shared/types/models'

const GROUP_COLUMNS = `id, name, slug, summary, icon,
  pricing_plans(id, name, slug, price, price_suffix, description, cta_label, is_popular, position),
  pricing_features(id, label, group_label, position, pricing_plan_features(plan_id, value_type, value_text))` as const

export interface PlanWrite {
  id: string
  service_id: string
  name: string
  slug: string
  price: number
  price_suffix: string
  description: string
  cta_label: string
  is_popular: boolean
  position: number
}

export interface FeatureWrite {
  id: string
  service_id: string
  label: string
  group_label: string
  position: number
}

export interface CellWrite {
  plan_id: string
  feature_id: string
  value_type: 'check' | 'cross' | 'text'
  value_text: string
}

async function groups(db: Db, options: { serviceId?: string, activeOnly: boolean }): Promise<PricingGroup[]> {
  let query = db.from('services').select(GROUP_COLUMNS).order('position')
  if (options.activeOnly) query = query.eq('is_active', true)
  if (options.serviceId) query = query.eq('id', options.serviceId)
  const rows = unwrap(await query)

  return rows.map(row => ({
    service: { id: row.id, name: row.name, slug: row.slug, summary: row.summary, icon: row.icon },
    plans: [...row.pricing_plans]
      .sort((a, b) => a.position - b.position)
      .map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: Number(plan.price),
        priceSuffix: plan.price_suffix,
        description: plan.description,
        ctaLabel: plan.cta_label,
        isPopular: plan.is_popular,
      })),
    features: [...row.pricing_features]
      .sort((a, b) => a.position - b.position)
      .map(feature => ({
        id: feature.id,
        label: feature.label,
        group: feature.group_label,
        cells: Object.fromEntries(feature.pricing_plan_features.map(cell => [
          cell.plan_id,
          { type: cell.value_type as PricingCell['type'], text: cell.value_text },
        ])),
      })),
  }))
}

async function replace(db: Db, serviceId: string, plans: PlanWrite[], features: FeatureWrite[], cells: CellWrite[]) {
  const planIds = plans.map(plan => plan.id)
  const featureIds = features.map(feature => feature.id)

  const planRemoval = db.from('pricing_plans').delete().eq('service_id', serviceId)
  const featureRemoval = db.from('pricing_features').delete().eq('service_id', serviceId)
  await Promise.all([
    planRemoval.not('id', 'in', `(${planIds.join(',') || '00000000-0000-0000-0000-000000000000'})`).then(ensureOk),
    featureRemoval.not('id', 'in', `(${featureIds.join(',') || '00000000-0000-0000-0000-000000000000'})`).then(ensureOk),
  ])

  if (plans.length) ensureOk(await db.from('pricing_plans').upsert(plans))
  if (features.length) ensureOk(await db.from('pricing_features').upsert(features))
  if (planIds.length) ensureOk(await db.from('pricing_plan_features').delete().in('plan_id', planIds))
  if (cells.length) ensureOk(await db.from('pricing_plan_features').insert(cells))
}

export const pricingModel = {
  groups,
  replace,
}
