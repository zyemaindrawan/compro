export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA'

interface VerifyResponse {
  'success': boolean
  'error-codes'?: string[]
}

function secretKey() {
  const key = useRuntimeConfig().turnstile.secretKey
  if (key) return key
  if (import.meta.dev) return TURNSTILE_TEST_SECRET
  console.error('[turnstile] NUXT_TURNSTILE_SECRET_KEY is not set')
  fail(503, 'This form is temporarily unavailable. Please email us instead.')
}

async function verify(token: string, ip: string | undefined): Promise<boolean> {
  const secret = secretKey()
  const url = useRuntimeConfig().turnstile.verifyUrl
  const body = new URLSearchParams({ secret, response: token })
  if (ip) body.set('remoteip', ip)

  try {
    const result = await $fetch<VerifyResponse>(url, { method: 'POST', body, timeout: 8000 })
    if (!result.success) console.warn('[turnstile] rejected', result['error-codes'])
    return result.success
  }
  catch (error) {
    console.error('[turnstile] verification request failed', error instanceof Error ? error.message : error)
    fail(503, 'We could not verify the request. Please try again in a minute.')
  }
}

export const turnstileService = {
  verify,
}
