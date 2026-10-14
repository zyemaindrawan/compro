import type { BlockInput, BlockType } from '#shared/schemas/block.schema'

export interface BlockDefinition {
  type: BlockType
  label: string
  icon: string
  description: string
  create: () => BlockInput['props']
}

const emptyLink = () => ({ label: '', href: '' })

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero',
    icon: 'i-lucide-panel-top',
    description: 'Headline, intro and buttons. Use once, at the top.',
    create: () => ({ eyebrow: '', heading: 'New headline', subheading: '', primary: emptyLink(), secondary: emptyLink(), media_id: null }),
  },
  {
    type: 'rich_text',
    label: 'Rich text',
    icon: 'i-lucide-text',
    description: 'Formatted text with headings, lists, links and images.',
    create: () => ({ content_json: { type: 'doc', content: [{ type: 'paragraph' }] }, content_html: '' }),
  },
  {
    type: 'image_text',
    label: 'Image and text',
    icon: 'i-lucide-gallery-horizontal',
    description: 'An image beside a heading, paragraph and link.',
    create: () => ({ heading: 'New section', body: '', media_id: null, image_side: 'left', cta: emptyLink() }),
  },
  {
    type: 'services_grid',
    label: 'Services',
    icon: 'i-lucide-layout-grid',
    description: 'Cards linking to service pages.',
    create: () => ({ heading: 'What we build', intro: '', service_ids: [] }),
  },
  {
    type: 'pricing_table',
    label: 'Pricing',
    icon: 'i-lucide-tags',
    description: 'Plans and comparison table for one or all services.',
    create: () => ({ heading: 'Pricing', intro: '', service_id: null }),
  },
  {
    type: 'latest_articles',
    label: 'Latest articles',
    icon: 'i-lucide-newspaper',
    description: 'The newest articles, optionally from one category.',
    create: () => ({ heading: 'From the blog', limit: 3, category_slug: '' }),
  },
  {
    type: 'stats',
    label: 'Stats',
    icon: 'i-lucide-chart-no-axes-column',
    description: 'Two to six numbers with labels.',
    create: () => ({ heading: '', items: [{ value: '10+', label: 'Projects shipped' }] }),
  },
  {
    type: 'cta',
    label: 'Call to action',
    icon: 'i-lucide-megaphone',
    description: 'A contrasting band with one button.',
    create: () => ({ heading: 'Have a project in mind?', body: '', primary: { label: 'Request a quote', href: '/quote' } }),
  },
]

export function blockDefinition(type: string) {
  return BLOCK_DEFINITIONS.find(definition => definition.type === type)
}

export function blockSummary(block: BlockInput) {
  const props = block.props as Record<string, unknown>
  if (typeof props.heading === 'string' && props.heading) return props.heading
  if (typeof props.content_html === 'string') return props.content_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return ''
}
