import type { H3Event } from 'h3'
import { adminModel } from '../models/admin.model'

async function stats(event: H3Event) {
  await requireAdmin(event)
  return adminModel.dashboardStats(useDb(event))
}

export const dashboardController = {
  stats,
}
