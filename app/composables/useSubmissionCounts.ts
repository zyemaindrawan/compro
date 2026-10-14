import type { SubmissionCounts } from '#shared/types/models'

export function useSubmissionCounts() {
  const api = useApi()
  return useAsyncData(SUBMISSION_COUNTS_KEY, () => api<SubmissionCounts>('/api/admin/submissions/counts'), { server: false })
}
