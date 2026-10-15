import { serviceController } from '../../../controllers/service.controller'
import { PUBLIC_CACHE_GROUP } from '../../../services/cache.service'

export default defineCachedEventHandler(serviceController.publicList, {
  group: PUBLIC_CACHE_GROUP,
  name: 'services',
  getKey: () => 'all',
  maxAge: 60 * 60,
  swr: true,
})
