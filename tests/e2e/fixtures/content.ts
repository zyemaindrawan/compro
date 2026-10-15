import type { APIRequestContext } from '@playwright/test'
import sharp from 'sharp'
import { expect } from '@playwright/test'

export function e2eSlug(prefix: string) {
  return `e2e-${prefix}-${Date.now().toString(36)}`
}

export function articlePayload(title: string, slug: string, publishedAt = new Date().toISOString()) {
  return {
    title,
    slug,
    excerpt: `${title}: what we changed and what it saved the client.`,
    content_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Body text for an end-to-end test.' }] }] },
    content_html: '<p>Body text for an end-to-end test.</p>',
    cover_media_id: null,
    category_ids: [],
    status: 'published',
    published_at: publishedAt,
    meta_title: '',
    meta_description: '',
    meta_keywords: [],
    canonical_url: '',
    og_media_id: null,
    noindex: false,
  }
}

export async function createArticle(api: APIRequestContext, payload: ReturnType<typeof articlePayload>) {
  const response = await api.post('/api/admin/articles', { data: payload })
  expect(response.status(), await response.text()).toBe(200)
  return (await response.json() as { id: string }).id
}

export async function deleteArticles(api: APIRequestContext, ids: string[]) {
  if (ids.length) await api.delete('/api/admin/articles', { data: { ids } })
}

export function png(width: number, height: number, color: string, label = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="58%" font-size="${Math.round(height / 4)}" font-family="sans-serif" text-anchor="middle" fill="white">${label}</text></svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

export interface UploadedMedia {
  id: string
  url: string
  mime: string
  width: number | null
  height: number | null
  variants: { width: number, url: string }[]
}

export async function uploadMedia(api: APIRequestContext, buffer: Buffer, name: string, purpose: 'content' | 'logo' = 'content') {
  const response = await api.post('/api/admin/media', {
    multipart: {
      file: { name: `${name}.png`, mimeType: 'image/png', buffer },
      alt: `${name} test image`,
      purpose,
    },
  })
  expect(response.status(), await response.text()).toBe(200)
  return await response.json() as UploadedMedia
}
