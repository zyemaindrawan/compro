import { pricingController } from '../../controllers/pricing.controller'
import { PUBLIC_CACHE_GROUP } from '../../services/cache.service'

export default defineCachedEventHandler(pricingController.publicList, {
  group: PUBLIC_CACHE_GROUP,
  name: 'pricing',
  getKey: () => 'all',
  maxAge: 60 * 60,
  swr: true,
})
