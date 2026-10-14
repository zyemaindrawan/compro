import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const MIN_BYTES = 1024

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    if (event.path.startsWith('/__nuxt_error')) return
    const type = String(response.headers?.['content-type'] ?? getResponseHeader(event, 'content-type') ?? '')
    if (!type.includes('text/html') || typeof response.body !== 'string' || response.body.length < MIN_BYTES) return

    const accepted = getRequestHeader(event, 'accept-encoding') ?? ''
    const encoding = accepted.includes('br') ? 'br' : accepted.includes('gzip') ? 'gzip' : null
    if (!encoding) return

    const body = Buffer.from(response.body)
    response.body = encoding === 'br'
      ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } })
      : gzipSync(body, { level: 6 })
    response.headers = { ...response.headers, 'content-encoding': encoding, 'vary': 'accept-encoding' }
  })
})
