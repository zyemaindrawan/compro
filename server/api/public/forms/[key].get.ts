import { formController } from '../../../controllers/form.controller'
import { PUBLIC_CACHE_GROUP } from '../../../services/cache.service'

export default defineCachedEventHandler(formController.publicShow, {
  group: PUBLIC_CACHE_GROUP,
  name: 'form',
  maxAge: 60 * 60,
  swr: true,
})
