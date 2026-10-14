import { isBlockType, parseBlockProps, type BlockInput } from '#shared/schemas/block.schema'
import type { PageBlock } from '#shared/types/models'
import type { Json } from '#shared/types/database'
import { contentService } from './content.service'

export interface BlockRequirements {
  mediaIds: string[]
  serviceIds: string[] | 'all' | null
  pricing: boolean
  articleQueries: { key: string, category: string, limit: number }[]
  portfolioQueries: { key: string, serviceId: string | null, limit: number }[]
  logos: boolean
  testimonialLimit: number
  faqs: boolean
  formKeys: string[]
}

export function articleQueryKey(category: string, limit: number) {
  return `${category || 'all'}:${limit}`
}

export function portfolioQueryKey(serviceId: string | null, limit: number) {
  return `${serviceId ?? 'all'}:${limit}`
}

function validBlocks(blocks: PageBlock[]): PageBlock[] {
  return blocks.flatMap((block) => {
    if (!isBlockType(block.type)) {
      console.warn('[blocks] unknown block type skipped', block.type, block.id)
      return []
    }
    const props = parseBlockProps(block.type, block.props)
    if (!props) {
      console.warn('[blocks] invalid props skipped', block.type, block.id)
      return []
    }
    return [{ ...block, props: props as Record<string, unknown> }]
  })
}

function requirements(blocks: PageBlock[]): BlockRequirements {
  const media = new Set<string>()
  const services = new Set<string>()
  const queries = new Map<string, { key: string, category: string, limit: number }>()
  const portfolio = new Map<string, { key: string, serviceId: string | null, limit: number }>()
  const formKeys = new Set<string>()
  let allServices = false
  let pricing = false
  let logos = false
  let faqs = false
  let testimonialLimit = 0

  for (const block of blocks) {
    const props = block.props
    if (typeof props.media_id === 'string') media.add(props.media_id)

    if (block.type === 'services_grid') {
      const ids = props.service_ids as string[]
      if (ids.length) ids.forEach(id => services.add(id))
      else allServices = true
    }
    if (block.type === 'pricing_table') pricing = true
    if (block.type === 'latest_articles') {
      const category = String(props.category_slug ?? '')
      const limit = Number(props.limit)
      const key = articleQueryKey(category, limit)
      queries.set(key, { key, category, limit })
    }
    if (block.type === 'portfolio_grid') {
      const serviceId = typeof props.service_id === 'string' ? props.service_id : null
      const limit = Number(props.limit)
      const key = portfolioQueryKey(serviceId, limit)
      portfolio.set(key, { key, serviceId, limit })
    }
    if (block.type === 'client_logos') logos = true
    if (block.type === 'testimonials') testimonialLimit = Math.max(testimonialLimit, Number(props.limit))
    if (block.type === 'faq') faqs = true
    if (block.type === 'form') formKeys.add(String(props.form_key))
  }

  return {
    mediaIds: [...media],
    serviceIds: allServices ? 'all' : services.size ? [...services] : null,
    pricing,
    articleQueries: [...queries.values()],
    portfolioQueries: [...portfolio.values()],
    logos,
    testimonialLimit,
    faqs,
    formKeys: [...formKeys],
  }
}

function prepareForSave(blocks: BlockInput[]) {
  return blocks.map((block) => {
    const props = block.type === 'rich_text'
      ? { ...block.props, content_html: contentService.sanitizeArticleHtml(block.props.content_html) }
      : block.props
    return {
      id: block.id ?? crypto.randomUUID(),
      type: block.type,
      props: props as unknown as NonNullable<Json>,
      is_visible: block.is_visible,
    }
  })
}

export const blockService = {
  validBlocks,
  requirements,
  prepareForSave,
}
