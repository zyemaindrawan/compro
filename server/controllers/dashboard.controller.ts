import type { H3Event } from 'h3'
import type { DashboardStats } from '#shared/types/models'
import { adminModel } from '../models/admin.model'
import { submissionModel } from '../models/submission.model'

const LATEST_SUBMISSIONS = 5

async function stats(event: H3Event): Promise<DashboardStats> {
  await requireAdmin(event)
  const db = useDb(event)
  const [counts, latestSubmissions] = await Promise.all([
    adminModel.dashboardStats(db),
    submissionModel.latest(db, LATEST_SUBMISSIONS),
  ])
  return { ...counts, latestSubmissions }
}

export const dashboardController = {
  stats,
}
