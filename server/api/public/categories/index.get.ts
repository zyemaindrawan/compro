import { categoryController } from '../../../controllers/category.controller'
import { PUBLIC_CACHE_GROUP } from '../../../services/cache.service'

export default defineCachedEventHandler(categoryController.publicList, {
  group: PUBLIC_CACHE_GROUP,
  name: 'categories',
  getKey: () => 'all',
  maxAge: 60 * 10,
  swr: true,
})
