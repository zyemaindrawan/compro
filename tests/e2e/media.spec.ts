import { png, uploadMedia } from './fixtures/content'
import { expect, test } from './fixtures'

test('uploaded raster images are stored as WebP with variants and dimensions', async ({ adminApi, request }) => {
  const media = await uploadMedia(adminApi, await png(1600, 1000, '#7c2d12', 'E2E'), 'e2e-upload')
  try {
    expect(media.mime).toBe('image/webp')
    expect(media.width).toBe(1600)
    expect(media.height).toBe(1000)
    expect(media.variants.map(variant => variant.width)).toEqual([480, 960, 1440])

    const file = await request.get(media.url)
    expect(file.headers()['content-type']).toContain('image/webp')
  }
  finally {
    await adminApi.delete(`/api/admin/media/${media.id}`)
  }
})
