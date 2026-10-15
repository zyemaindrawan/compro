import type { H3Event } from 'h3'

export interface DbQueryLog {
  count: number
  log: string[]
}

declare module 'h3' {
  interface H3EventContext {
    dbQueries?: DbQueryLog
  }
}

export function dbQueryLogEnabled() {
  return Boolean(useRuntimeConfig().dbQueryLog)
}

function currentEvent(): H3Event | undefined {
  try {
    return useEvent()
  }
  catch {
    return undefined
  }
}

function describe(input: RequestInfo | URL, init?: RequestInit) {
  const url = new URL(input instanceof Request ? input.url : String(input))
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET')
  return { url, label: `${method} ${url.pathname.replace('/rest/v1/', '')}` }
}

export function createCountingFetch(resolveEvent: () => H3Event | undefined = currentEvent): typeof fetch {
  return (input, init) => {
    const { url, label } = describe(input, init)
    const metrics = url.pathname.startsWith('/rest/v1/') ? resolveEvent()?.context.dbQueries : undefined
    if (metrics) {
      metrics.count += 1
      metrics.log.push(label)
    }
    return fetch(input, init)
  }
}
