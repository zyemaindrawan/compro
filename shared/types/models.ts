import type { WorkHour } from '../schemas/settings.schema'

export interface MediaVariant {
  width: number
  url: string
}

export interface MediaAsset {
  id: string
  url: string
  alt: string
  width: number | null
  height: number | null
  mime: string
  sizeBytes: number
  blurhash: string | null
  variants: MediaVariant[]
  createdAt: string
}

export interface SocialLink {
  id: string
  platform: string
  label: string
  url: string
  icon: string
  isActive: boolean
}

export interface MarqueeSettings {
  autoplay: boolean
  speed: number
  pauseOnHover: boolean
}

export interface SiteSettings {
  siteName: string
  titleTemplate: string
  tagline: string
  description: string
  logoLight: MediaAsset | null
  logoDark: MediaAsset | null
  favicon: MediaAsset | null
  defaultOg: MediaAsset | null
  phone: string
  whatsappNumber: string
  whatsappMessage: string
  email: string
  address: string
  mapUrl: string
  workHours: WorkHour[]
  timezone: string
  umamiWebsiteId: string
  umamiScriptUrl: string
  marquee: MarqueeSettings
  socialLinks: SocialLink[]
  updatedAt: string
}

export interface NavService {
  name: string
  slug: string
}

export interface PublicLayoutData {
  settings: SiteSettings
  services: NavService[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  perPage: number
}

export interface AdminProfile {
  userId: string
  email: string
  displayName: string
  bio: string
  avatar: MediaAsset | null
}

export interface DashboardStats {
  publishedArticles: number
  draftArticles: number
  newSubmissions: number
  submissions30d: number
  mediaFiles: number
}

export interface MfaFactor {
  id: string
  friendlyName: string
  status: 'verified' | 'unverified'
  createdAt: string
}

export type AuthNextStep = 'enroll' | 'verify' | 'done'
