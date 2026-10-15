import type { Db } from '../utils/supabase'

export type OrderedTable = 'portfolio_items' | 'client_logos' | 'testimonials' | 'faqs'

async function nextPosition(db: Db, table: OrderedTable) {
  const { count, error } = await db.from(table).select('id', { count: 'exact', head: true })
  if (error) throwDbError(error)
  return count ?? 0
}

async function reorder(db: Db, table: OrderedTable, ids: string[]) {
  ensureOk(await db.rpc('fn_reorder', { p_table: table, p_ids: ids }))
}

export const orderingModel = {
  nextPosition,
  reorder,
}
