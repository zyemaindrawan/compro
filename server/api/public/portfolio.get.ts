import { portfolioController } from '../../controllers/collection.controller'
import { PUBLIC_CACHE_GROUP } from '../../services/cache.service'

export default defineCachedEventHandler(portfolioController.publicList, {
  group: PUBLIC_CACHE_GROUP,
  name: 'portfolio',
  getKey: () => 'all',
  maxAge: 60 * 60,
  swr: true,
})
