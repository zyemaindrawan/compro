import { serviceController } from '../../../controllers/service.controller'
import { PUBLIC_CACHE_GROUP } from '../../../services/cache.service'

export default defineCachedEventHandler(serviceController.publicShow, {
  group: PUBLIC_CACHE_GROUP,
  name: 'service',
  maxAge: 60 * 60,
  swr: true,
})
