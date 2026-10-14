import type { H3Event } from 'h3'
import { settingsUpdateSchema } from '#shared/schemas/settings.schema'
import type { PublicLayoutData } from '#shared/types/models'
import { settingsModel } from '../models/settings.model'
import { serviceModel } from '../models/service.model'
import { cacheService } from '../services/cache.service'

async function publicLayout(): Promise<PublicLayoutData> {
  const db = useAnonDb()
  const [settings, services] = await Promise.all([
    settingsModel.getSettings(db, { activeLinksOnly: true }),
    serviceModel.listNav(db),
  ])
  return { settings, services }
}

async function show(event: H3Event) {
  const db = await useDb(event)
  return settingsModel.getSettings(db, { activeLinksOnly: false })
}

async function update(event: H3Event) {
  const admin = await requireAdmin(event)
  const { social_links: socialLinks, ...input } = await validateBody(event, settingsUpdateSchema)
  const db = await useDb(event)

  await settingsModel.updateSettings(db, input, admin.userId)
  await settingsModel.replaceSocialLinks(db, socialLinks)
  await cacheService.purgePublic()

  return settingsModel.getSettings(db, { activeLinksOnly: false })
}

export const settingsController = {
  publicLayout,
  show,
  update,
}
