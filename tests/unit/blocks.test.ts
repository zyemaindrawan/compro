import { describe, expect, it, vi } from 'vitest'
import { articleQueryKey, blockService } from '../../server/services/block.service'
import type { PageBlock } from '../../shared/types/models'

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const block = (type: string, props: Record<string, unknown>, id = uuid(Math.floor(Math.random() * 1e6))): PageBlock => ({ id, type, props, isVisible: true })

describe('blockService.validBlocks', () => {
  it('drops unknown types and invalid props without throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const blocks = [
      block('cta', { heading: 'Talk to us', body: '', primary: { label: 'Contact', href: '/contact' } }),
      block('carousel', {}),
      block('cta', { heading: '', body: '', primary: { label: 'x', href: 'javascript:alert(1)' } }),
    ]
    expect(blockService.validBlocks(blocks).map(b => b.type)).toEqual(['cta'])
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})

describe('blockService.requirements', () => {
  it('collects every data need in one pass and dedupes article queries', () => {
    const req = blockService.requirements([
      block('hero', { media_id: uuid(1) }),
      block('image_text', { media_id: uuid(2) }),
      block('services_grid', { service_ids: [uuid(3), uuid(4)] }),
      block('pricing_table', { service_id: null }),
      block('latest_articles', { category_slug: '', limit: 3 }),
      block('latest_articles', { category_slug: '', limit: 3 }),
      block('latest_articles', { category_slug: 'cloud', limit: 6 }),
    ])
    expect(req.mediaIds).toEqual([uuid(1), uuid(2)])
    expect(req.serviceIds).toEqual([uuid(3), uuid(4)])
    expect(req.pricing).toBe(true)
    expect(req.articleQueries.map(q => q.key)).toEqual([articleQueryKey('', 3), articleQueryKey('cloud', 6)])
  })

  it('asks for all services when a grid lists none', () => {
    expect(blockService.requirements([block('services_grid', { service_ids: [] })]).serviceIds).toBe('all')
    expect(blockService.requirements([]).serviceIds).toBeNull()
  })
})

describe('blockService.prepareForSave', () => {
  it('sanitizes rich text html and assigns ids to new blocks', () => {
    const [saved] = blockService.prepareForSave([{
      type: 'rich_text',
      is_visible: true,
      props: { content_json: {}, content_html: '<p>Hi</p><script>x()</script>' },
    }])
    expect(saved?.id).toMatch(/^[0-9a-f-]{36}$/)
    expect((saved?.props as { content_html: string }).content_html).toBe('<p>Hi</p>')
  })
})
