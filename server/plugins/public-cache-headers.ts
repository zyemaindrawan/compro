// Cached handlers send `s-maxage` and `last-modified` without `max-age`, which lets browsers
// (and any CDN) reuse a public API response after an admin edit has purged the server cache.
// `no-cache` keeps the ETag round trip (304) but makes every client revalidate with the server.
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('beforeResponse', (event) => {
    if (event.node.res.headersSent || !event.path.startsWith('/api/public/')) return
    setResponseHeader(event, 'cache-control', 'no-cache')
  })
})
