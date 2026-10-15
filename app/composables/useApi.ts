import type { FetchError } from 'ofetch'

interface ApiErrorData {
  message?: string
  statusMessage?: string
  data?: { code?: string, fields?: Record<string, string> }
}

export interface FormError {
  name: string
  message: string
}

export function apiErrorMessage(error: unknown) {
  const data = (error as FetchError<ApiErrorData>)?.data
  if (data?.message) return data.message
  if ((error as FetchError)?.statusCode === 429) return 'Too many attempts. Try again in a minute.'
  if ((error as FetchError)?.statusCode === undefined) return 'Could not reach the server. Check your connection.'
  return 'Something went wrong. Please try again.'
}

export function apiFieldErrors(error: unknown): FormError[] {
  const fields = (error as FetchError<ApiErrorData>)?.data?.data?.fields ?? {}
  return Object.entries(fields).map(([name, message]) => ({ name, message }))
}

export function useApi() {
  const session = useAdminSession()

  return $fetch.create({
    async onResponseError({ response }) {
      const code = (response._data as ApiErrorData | undefined)?.data?.code
      if (response.status === 401) {
        session.reset()
        await navigateTo('/admin/login')
      }
      else if (response.status === 403 && code === 'mfa_required') {
        await session.refresh()
        await navigateTo('/admin/mfa')
      }
    },
  })
}

export function useNotify() {
  const toast = useToast()
  return {
    success: (title: string, description?: string) =>
      toast.add({ title, description, color: 'success', icon: 'i-lucide-circle-check' }),
    error: (error: unknown, title = 'Could not complete the request') =>
      toast.add({ title, description: apiErrorMessage(error), color: 'error', icon: 'i-lucide-circle-alert' }),
  }
}
