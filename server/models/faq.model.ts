import type { Db } from '../utils/supabase'
import type { FaqInput } from '#shared/schemas/engagement.schema'
import type { AdminFaq, Faq } from '#shared/types/models'
import { orderingModel } from './ordering.model'

const COLUMNS = 'id, question, answer, group_label, is_active' as const
const LIMIT = 200

interface FaqRow {
  id: string
  question: string
  answer: string
  group_label: string
  is_active: boolean
}

function toFaq(row: FaqRow): AdminFaq {
  return { id: row.id, question: row.question, answer: row.answer, group: row.group_label, isActive: row.is_active }
}

async function listPublic(db: Db, group?: string): Promise<Faq[]> {
  let query = db.from('faqs').select(COLUMNS).eq('is_active', true).order('position').limit(LIMIT)
  if (group) query = query.eq('group_label', group)
  return unwrap(await query).map((row) => {
    const { isActive: _isActive, ...faq } = toFaq(row)
    return faq
  })
}

async function listAdmin(db: Db): Promise<AdminFaq[]> {
  return unwrap(await db.from('faqs').select(COLUMNS).order('position').limit(LIMIT)).map(toFaq)
}

async function create(db: Db, input: FaqInput) {
  const position = await orderingModel.nextPosition(db, 'faqs')
  ensureOk(await db.from('faqs').insert({ ...input, position }))
}

async function update(db: Db, id: string, input: FaqInput) {
  ensureOk(await db.from('faqs').update(input).eq('id', id))
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('faqs').delete().eq('id', id))
}

export const faqModel = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
}
