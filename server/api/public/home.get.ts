import { pageController } from '../../controllers/page.controller'
import { PUBLIC_CACHE_GROUP } from '../../services/cache.service'

export default defineCachedEventHandler(pageController.home, {
  group: PUBLIC_CACHE_GROUP,
  name: 'home',
  getKey: () => 'home',
  maxAge: 60 * 60,
  swr: true,
})
