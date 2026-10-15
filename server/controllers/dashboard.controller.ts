import type { H3Event } from 'h3'
import type { DashboardStats, LaunchChecks } from '#shared/types/models'
import { adminModel } from '../models/admin.model'
import { submissionModel } from '../models/submission.model'

const LATEST_SUBMISSIONS = 5

function launchChecks(hasDefaultOg: boolean): LaunchChecks {
  const config = useRuntimeConfig()
  return {
    defaultOgImage: hasDefaultOg,
    smtp: Boolean(config.smtp.host && config.smtp.user && config.smtp.pass && config.smtp.from),
    turnstile: Boolean(config.turnstile.secretKey && config.public.turnstile.siteKey),
    ipHashSalt: config.ipHashSalt.length >= 16,
    trustProxy: Boolean(config.trustProxy && config.trustProxy !== 'none'),
  }
}

async function stats(event: H3Event): Promise<DashboardStats> {
  await requireAdmin(event)
  const db = useDb(event)
  const [{ hasDefaultOg, ...counts }, latestSubmissions] = await Promise.all([
    adminModel.dashboardStats(db),
    submissionModel.latest(db, LATEST_SUBMISSIONS),
  ])
  return { ...counts, latestSubmissions, checks: launchChecks(hasDefaultOg) }
}

export const dashboardController = {
  stats,
}
