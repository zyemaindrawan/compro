import type { BadgeProps } from '@nuxt/ui'
import { SUBMISSION_STATUSES, type SubmissionStatus } from '#shared/schemas/engagement.schema'

export const SUBMISSION_STATUS_META: Record<SubmissionStatus, { label: string, color: BadgeProps['color'], icon: string }> = {
  new: { label: 'New', color: 'primary', icon: 'i-lucide-circle-dot' },
  contacted: { label: 'Contacted', color: 'info', icon: 'i-lucide-message-circle' },
  won: { label: 'Won', color: 'success', icon: 'i-lucide-circle-check' },
  lost: { label: 'Lost', color: 'neutral', icon: 'i-lucide-circle-x' },
  spam: { label: 'Spam', color: 'warning', icon: 'i-lucide-shield-alert' },
}

export const SUBMISSION_STATUS_ITEMS = SUBMISSION_STATUSES.map(status => ({
  label: SUBMISSION_STATUS_META[status].label,
  value: status,
  icon: SUBMISSION_STATUS_META[status].icon,
}))

export const SUBMISSION_COUNTS_KEY = 'admin-submission-counts'
