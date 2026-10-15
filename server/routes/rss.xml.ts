import { feedController } from '../controllers/feed.controller'
import { PUBLIC_CACHE_GROUP } from '../services/cache.service'

export default defineCachedEventHandler(feedController.rss, {
  group: PUBLIC_CACHE_GROUP,
  name: 'rss',
  getKey: () => 'feed',
  maxAge: 60 * 60,
  swr: true,
})
