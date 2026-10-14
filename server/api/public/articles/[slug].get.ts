import { articleController } from '../../../controllers/article.controller'
import { PUBLIC_CACHE_GROUP } from '../../../services/cache.service'

export default defineCachedEventHandler(articleController.publicShow, {
  group: PUBLIC_CACHE_GROUP,
  name: 'article',
  maxAge: 60 * 10,
  swr: true,
})
