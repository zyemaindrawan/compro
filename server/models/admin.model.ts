import type { Db } from '../utils/supabase'
import type { ProfileInput } from '#shared/schemas/auth.schema'
import type { AdminProfile, DashboardStats } from '#shared/types/models'

const PROFILE_COLUMNS = `user_id, display_name, bio, avatar:media!admin_profiles_avatar_media_id_fkey(${MEDIA_COLUMNS})` as const

async function findProfile(db: Db, userId: string, email = ''): Promise<AdminProfile | null> {
  const { data, error } = await db
    .from('admin_profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throwDbError(error)
  if (!data) return null

  return {
    userId: data.user_id,
    email,
    displayName: data.display_name,
    bio: data.bio,
    avatar: toMediaAsset(data.avatar),
  }
}

async function updateProfile(db: Db, userId: string, input: ProfileInput) {
  ensureOk(await db.from('admin_profiles').update(input).eq('user_id', userId))
}

async function dashboardStats(db: Db): Promise<DashboardStats> {
  const row = unwrap(await db.from('v_dashboard_stats').select('*').single())
  return {
    publishedArticles: row.published_articles ?? 0,
    draftArticles: row.draft_articles ?? 0,
    newSubmissions: row.new_submissions ?? 0,
    submissions30d: row.submissions_30d ?? 0,
    mediaFiles: row.media_files ?? 0,
  }
}

export const adminModel = {
  findProfile,
  updateProfile,
  dashboardStats,
}
