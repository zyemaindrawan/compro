import type { MediaPurpose } from '#shared/schemas/media.schema'
import type { MediaAsset } from '#shared/types/models'

export function altFromFilename(name: string) {
  return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
}

export function useMediaUpload() {
  const api = useApi()
  const notify = useNotify()

  async function uploadOne(file: File, purpose: MediaPurpose = 'content') {
    const body = new FormData()
    body.append('file', file)
    body.append('purpose', purpose)
    body.append('alt', altFromFilename(file.name))
    return api<MediaAsset>('/api/admin/media', { method: 'POST', body })
  }

  async function uploadMany(files: File[], purpose: MediaPurpose = 'content', onProgress?: (done: number) => void) {
    const uploaded: MediaAsset[] = []
    let done = 0
    for (const file of files) {
      try {
        uploaded.push(await uploadOne(file, purpose))
      }
      catch (error) {
        notify.error(error, `Could not upload ${file.name}`)
      }
      onProgress?.(++done)
    }
    return uploaded
  }

  return { uploadOne, uploadMany }
}
