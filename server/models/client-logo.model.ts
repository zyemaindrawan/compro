import type { Db } from '../utils/supabase'
import type { MediaRow } from '../utils/media'
import type { ClientLogoInput } from '#shared/schemas/engagement.schema'
import type { AdminClientLogo, ClientLogo } from '#shared/types/models'
import { orderingModel } from './ordering.model'

const COLUMNS = `id, name, url, is_active, logo:media(${MEDIA_COLUMNS})` as const
const LIMIT = 100

interface ClientLogoRow {
  id: string
  name: string
  url: string
  is_active: boolean
  logo: MediaRow
}

function toLogo(row: ClientLogoRow): AdminClientLogo {
  return { id: row.id, name: row.name, url: row.url, logo: toMediaAsset(row.logo), isActive: row.is_active }
}

async function listPublic(db: Db): Promise<ClientLogo[]> {
  const rows = unwrap(await db.from('client_logos').select(COLUMNS).eq('is_active', true).order('position').limit(LIMIT)) as unknown as ClientLogoRow[]
  return rows.map((row) => {
    const { isActive: _isActive, ...logo } = toLogo(row)
    return logo
  })
}

async function listAdmin(db: Db): Promise<AdminClientLogo[]> {
  const rows = unwrap(await db.from('client_logos').select(COLUMNS).order('position').limit(LIMIT)) as unknown as ClientLogoRow[]
  return rows.map(toLogo)
}

async function create(db: Db, input: ClientLogoInput) {
  const position = await orderingModel.nextPosition(db, 'client_logos')
  ensureOk(await db.from('client_logos').insert({ ...input, position }))
}

async function update(db: Db, id: string, input: ClientLogoInput) {
  ensureOk(await db.from('client_logos').update(input).eq('id', id))
}

async function remove(db: Db, id: string) {
  ensureOk(await db.from('client_logos').delete().eq('id', id))
}

export const clientLogoModel = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
}
