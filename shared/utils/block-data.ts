import type { BlockData } from '../types/models'

export function emptyBlockData(overrides: Partial<BlockData> = {}): BlockData {
  return {
    media: {},
    services: [],
    pricing: [],
    articles: {},
    portfolio: {},
    logos: [],
    testimonials: [],
    faqs: [],
    forms: {},
    ...overrides,
  }
}
