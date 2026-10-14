import type { Db } from '../utils/supabase'

export interface RedirectRule {
  to: string
  status: number
}

async function all(db: Db): Promise<Record<string, RedirectRule>> {
  const rows = unwrap(await db.from('redirects').select('from_path, to_path, status_code'))
  return Object.fromEntries(rows.map(row => [row.from_path, { to: row.to_path, status: row.status_code }]))
}

async function recordMove(db: Db, fromPath: string, toPath: string) {
  if (fromPath === toPath) return
  ensureOk(await db.from('redirects').delete().eq('from_path', toPath))
  ensureOk(await db.from('redirects').update({ to_path: toPath }).eq('to_path', fromPath))
  ensureOk(await db.from('redirects').upsert({ from_path: fromPath, to_path: toPath, status_code: 301 }, { onConflict: 'from_path' }))
}

export const redirectModel = {
  all,
  recordMove,
}
