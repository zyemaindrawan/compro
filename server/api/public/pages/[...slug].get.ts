import { pageController } from '../../../controllers/page.controller'
import { PUBLIC_CACHE_GROUP } from '../../../services/cache.service'

export default defineCachedEventHandler(pageController.staticPage, {
  group: PUBLIC_CACHE_GROUP,
  name: 'page',
  maxAge: 60 * 60,
  swr: true,
})
