interface SupabaseLikeError {
  code?: string
  message: string
  status?: number
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

export function fail(statusCode: number, message: string, data?: Record<string, unknown>): never {
  throw createError({ statusCode, statusMessage: message, message, data })
}

const PG_ERRORS: Record<string, [number, string]> = {
  '23505': [409, 'This value is already in use.'],
  '23503': [409, 'This item is still used elsewhere. Remove it from there first.'],
  '23514': [422, 'Some values are not valid.'],
  '22P02': [422, 'Some values are not valid.'],
  '42501': [403, 'You do not have permission to do this.'],
  'PGRST301': [403, 'You do not have permission to do this.'],
  'PGRST116': [404, 'Not found.'],
}

export function throwDbError(error: SupabaseLikeError): never {
  if (error.code === '23505' && /_slug_key|slug/.test(error.message)) {
    fail(409, 'This slug is already in use.', { fields: { slug: 'Already in use. Choose another slug.' } })
  }
  const known = error.code ? PG_ERRORS[error.code] : undefined
  if (known) fail(known[0], known[1])

  if (error.status === 403) fail(403, 'You do not have permission to do this.')
  if (error.status === 404) fail(404, 'Not found.')

  console.error('[db]', error.code ?? error.status, error.message)
  fail(500, GENERIC_MESSAGE)
}

export function unwrap<T>(result: { data: T, error: SupabaseLikeError | null }): NonNullable<T> {
  if (result.error) throwDbError(result.error)
  if (result.data === null || result.data === undefined) fail(404, 'Not found.')
  return result.data
}

export function ensureOk(result: { error: SupabaseLikeError | null }) {
  if (result.error) throwDbError(result.error)
}

export function isRangeError(error: SupabaseLikeError | null) {
  return error?.code === 'PGRST103'
}
