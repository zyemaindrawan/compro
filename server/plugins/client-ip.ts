import type { H3Event } from 'h3'

interface ParentContext {
  clientIp?: string
}

function parentContext(event: H3Event): ParentContext | undefined {
  return (event.node.req as { __unenv__?: ParentContext }).__unenv__
}

export default defineNitroPlugin((nitroApp) => {
  const policy = useRuntimeConfig().trustProxy
  if (!import.meta.dev && (!policy || policy === 'none')) {
    console.warn('[client-ip] NUXT_TRUST_PROXY is not set. Rate limits use the socket address, which behind a proxy is the proxy itself.')
  }

  nitroApp.hooks.hook('request', (event) => {
    const ip = parentContext(event)?.clientIp ?? resolveClientIp(event, policy)
    event.context.clientIp = ip
    event.node.req.headers[CLIENT_IP_HEADER] = ip
  })
})
