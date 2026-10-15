const MAX_HOPS = 20

export function normalizePath(path: string) {
  const clean = path.trim().split(/[?#]/)[0]?.replace(/\/{2,}/g, '/') ?? ''
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
}

export function isInternalPath(target: string) {
  return target.startsWith('/') && !target.startsWith('//')
}

export function findLoop(rules: Record<string, string>, from: string, to: string) {
  if (!isInternalPath(to)) return false
  const visited = new Set([from])
  let current = normalizePath(to)
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (visited.has(current)) return true
    visited.add(current)
    const next = rules[current]
    if (!next || !isInternalPath(next)) return false
    current = normalizePath(next)
  }
  return true
}

export function finalTarget(rules: Record<string, string>, to: string) {
  let target = to
  for (let hop = 0; hop < MAX_HOPS && isInternalPath(target); hop++) {
    const next = rules[normalizePath(target)]
    if (!next) break
    target = next
  }
  return target
}
