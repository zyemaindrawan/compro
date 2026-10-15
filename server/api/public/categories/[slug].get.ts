import { categoryController } from '../../../controllers/category.controller'
import { PUBLIC_CACHE_GROUP } from '../../../services/cache.service'

export default defineCachedEventHandler(categoryController.publicShow, {
  group: PUBLIC_CACHE_GROUP,
  name: 'category',
  maxAge: 60 * 10,
  swr: true,
})
