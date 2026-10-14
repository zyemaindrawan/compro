import { settingsController } from '../../controllers/settings.controller'
import { PUBLIC_CACHE_GROUP } from '../../services/cache.service'

export default defineCachedEventHandler(settingsController.publicLayout, {
  group: PUBLIC_CACHE_GROUP,
  name: 'layout',
  getKey: () => 'default',
  maxAge: 60 * 60,
  swr: true,
})
