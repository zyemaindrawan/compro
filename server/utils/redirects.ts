import { redirectModel } from '../models/redirect.model'
import { PUBLIC_CACHE_GROUP } from '../services/cache.service'

export const getRedirects = defineCachedFunction(() => redirectModel.all(useAnonDb()), {
  group: PUBLIC_CACHE_GROUP,
  name: 'redirects',
  getKey: () => 'all',
  maxAge: 60 * 10,
  swr: true,
})
