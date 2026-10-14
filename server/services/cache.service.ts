export const PUBLIC_CACHE_GROUP = 'public'

async function purgePublic() {
  const storage = useStorage('cache')
  const keys = await storage.getKeys(PUBLIC_CACHE_GROUP)
  await Promise.all(keys.map(key => storage.removeItem(key)))
}

export const cacheService = {
  purgePublic,
}
