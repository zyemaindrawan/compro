import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = Number(process.env.INITIAL_JS_BUDGET_KB ?? 200)
const output = resolve(process.argv[2] ?? '.output')
const { default: manifest } = await import(pathToFileURL(resolve(output, 'server/chunks/virtual/precomputed.mjs')).href)
const { dependencies } = manifest

const entryKey = Object.keys(dependencies).find(key => key.endsWith('nuxt/dist/app/entry.js'))
if (!entryKey) throw new Error('Entry chunk not found in the client manifest.')

const sizes = new Map()
function gzipSize(file) {
  if (!sizes.has(file)) sizes.set(file, gzipSync(readFileSync(resolve(output, 'public/_nuxt', file))).length)
  return sizes.get(file)
}

function scripts(key) {
  const preload = dependencies[key]?.preload ?? {}
  return Object.values(preload).filter(item => item.resourceType === 'script').map(item => item.file)
}

const pages = Object.keys(dependencies).filter(key => /^pages\/(?!admin)/.test(key))
const rows = pages.map((page) => {
  const files = new Set([...scripts(entryKey), ...scripts('layouts/default.vue'), ...scripts(page)])
  const bytes = [...files].reduce((total, file) => total + gzipSize(file), 0)
  return { page, kb: Math.round(bytes / 1024) }
}).sort((a, b) => b.kb - a.kb)

for (const row of rows) console.log(`${String(row.kb).padStart(4)} KB  ${row.page}`)

const over = rows.filter(row => row.kb > BUDGET_KB)
if (over.length) {
  console.error(`Initial JS over ${BUDGET_KB} KB gzip: ${over.map(row => row.page).join(', ')}`)
  process.exit(1)
}
console.log(`All public pages within ${BUDGET_KB} KB gzip (entry + default layout + page chunk).`)
