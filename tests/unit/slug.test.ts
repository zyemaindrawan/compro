import { describe, expect, it } from 'vitest'
import { SLUG_PATTERN, slugify } from '../../shared/utils/slug'

describe('slugify', () => {
  it('produces lowercase kebab-case ASCII', () => {
    expect(slugify('Build a PWA with Nuxt 4!')).toBe('build-a-pwa-with-nuxt-4')
  })

  it('strips diacritics and collapses separators', () => {
    expect(slugify('  Café   Déjà — Vu  ')).toBe('cafe-deja-vu')
  })

  it('spells out ampersands', () => {
    expect(slugify('Design & Build')).toBe('design-and-build')
  })

  it('cuts long input at a word boundary', () => {
    const slug = slugify('word '.repeat(40))
    expect(slug.length).toBeLessThanOrEqual(80)
    expect(slug.endsWith('-')).toBe(false)
    expect(SLUG_PATTERN.test(slug)).toBe(true)
  })

  it('returns an empty string when nothing is usable', () => {
    expect(slugify('!!!')).toBe('')
  })
})
