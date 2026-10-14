import { isBlockType, parseBlockProps, type BlockInput } from '#shared/schemas/block.schema'
import type { PageBlock } from '#shared/types/models'
import type { Json } from '#shared/types/database'
import { contentService } from './content.service'

export interface BlockRequirements {
  mediaIds: string[]
  serviceIds: string[] | 'all' | null
  pricing: boolean
  articleQueries: { key: string, category: string, limit: number }[]
}

export function articleQueryKey(category: string, limit: number) {
  return `${category || 'all'}:${limit}`
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
  let allServices = false
  let pricing = false

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
  }

  return {
    mediaIds: [...media],
    serviceIds: allServices ? 'all' : services.size ? [...services] : null,
    pricing,
    articleQueries: [...queries.values()],
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
