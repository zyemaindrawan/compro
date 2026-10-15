interface FetchErrorLike {
  statusCode?: number
}

export function pageError(error: FetchErrorLike | null | undefined, notFoundMessage: string) {
  const status = error?.statusCode ?? 404
  if (status >= 500) return createError({ statusCode: status, statusMessage: 'Server error', fatal: true })
  return createError({ statusCode: 404, statusMessage: notFoundMessage, fatal: true })
}
