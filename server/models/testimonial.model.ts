import type { Db } from '../utils/supabase'
import type { MediaRow } from '../utils/media'
import type { TestimonialInput } from '#shared/schemas/engagement.schema'
import type { AdminTestimonial, Testimonial } from '#shared/types/models'
import { orderingModel } from './ordering.model'

const COLUMNS = `id, author_name, author_role, company, quote, rating, is_active, avatar:media(${MEDIA_COLUMNS})` as const

interface TestimonialRow {
  id: string
  author_name: string
  author_role: string
  company: string
  quote: string
  rating: number | null
  is_active: boolean
  avatar: MediaRow | null
}

function toTestimonial(row: TestimonialRow): AdminTestimonial {
  return {
    id: row.id,
    authorName: row.author_name,
    authorRole: row.author_role,
    company: row.company,
    quote: row.quote,
    rating: row.rating,
    avatar: toMediaAsset(row.avatar),
    isActive: row.is_active,
  }
}

async function listPublic(db: Db, limit: number): Promise<Testimonial[]> {
  const rows = unwrap(await db.from('testimonials').select(COLUMNS).eq('is_active', true).order('position').limit(limit)) as unknown as TestimonialRow[]
  return rows.map((row) => {
    const { isActive: _isActive, ...testimonial } = toTestimonial(row)
    return testimonial
  })
}

async function listAdmin(db: Db): Promise<AdminTestimonial[]> {
  const rows = unwrap(await db.from('testimonials').select(COLUMNS).order('position').limit(200)) as unknown as TestimonialRow[]
  return rows.map(toTestimonial)
}

async function create(db: Db, input: TestimonialInput) {
  const position = await orderingModel.nextPosition(db, 'testimonials')
  ensureOk(await db.from('testimonials').insert({ ...input, position }))
}

async function update(db: Db, id: string, input: TestimonialInput) {
  ensureOk(await db.from('testimonials').update(input).eq('id', id))
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('testimonials').delete().eq('id', id))
}

export const testimonialModel = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
}
