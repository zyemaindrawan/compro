import { describe, expect, it } from 'vitest'
import { redirectSchema } from '../../shared/schemas/redirect.schema'
import { finalTarget, findLoop, normalizePath } from '../../shared/utils/redirect-graph'

describe('normalizePath', () => {
  it('strips query, trailing and duplicate slashes', () => {
    expect(normalizePath('/old-page/?utm=x')).toBe('/old-page')
    expect(normalizePath('blog//post/')).toBe('/blog/post')
    expect(normalizePath('/')).toBe('/')
  })
})

describe('findLoop', () => {
  const rules = { '/a': '/b', '/b': '/c', '/x': 'https://example.com/x' }

  it('detects a chain that returns to the source', () => {
    expect(findLoop(rules, '/c', '/a')).toBe(true)
    expect(findLoop(rules, '/c', '/c/')).toBe(true)
  })

  it('accepts chains that end or leave the site', () => {
    expect(findLoop(rules, '/d', '/a')).toBe(false)
    expect(findLoop(rules, '/y', '/x')).toBe(false)
    expect(findLoop(rules, '/a', 'https://example.com/a')).toBe(false)
  })
})

describe('redirectSchema', () => {
  const valid = { from_path: '/Old-Page/', to_path: '/new-page', status_code: 301 }

  it('normalizes the source path', () => {
    expect(redirectSchema.parse(valid).from_path).toBe('/Old-Page')
  })

  it('rejects reserved sources, assets, self redirects and protocol-relative targets', () => {
    expect(redirectSchema.safeParse({ ...valid, from_path: '/admin/login' }).success).toBe(false)
    expect(redirectSchema.safeParse({ ...valid, from_path: '/logo.png' }).success).toBe(false)
    expect(redirectSchema.safeParse({ ...valid, to_path: '/Old-Page' }).success).toBe(false)
    expect(redirectSchema.safeParse({ ...valid, to_path: '//evil.example' }).success).toBe(false)
    expect(redirectSchema.safeParse({ ...valid, status_code: 307 }).success).toBe(false)
  })

  it('allows legacy .html sources and external targets', () => {
    expect(redirectSchema.safeParse({ ...valid, from_path: '/about-us.html', to_path: 'https://example.com' }).success).toBe(true)
  })
})

describe('finalTarget', () => {
  it('follows existing rules so a new rule never creates a chain', () => {
    const rules = { '/a': '/b', '/b': '/c', '/x': 'https://example.com/x' }
    expect(finalTarget(rules, '/a')).toBe('/c')
    expect(finalTarget(rules, '/x')).toBe('https://example.com/x')
    expect(finalTarget(rules, '/z?ref=1')).toBe('/z?ref=1')
  })
})
