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
  latestSubmissions: SubmissionListItem[]
}

export interface MfaFactor {
  id: string
  friendlyName: string
  status: 'verified' | 'unverified'
  createdAt: string
}

export type AuthNextStep = 'enroll' | 'verify' | 'done'

export interface SeoFields {
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  canonicalUrl: string
  ogImage: MediaAsset | null
  noindex: boolean
}

export interface CategoryRef {
  name: string
  slug: string
}

export interface ArticleSummary {
  id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string | null
  readingMinutes: number
  cover: MediaAsset | null
  categories: CategoryRef[]
}

export interface ArticleAuthor {
  displayName: string
  bio: string
  avatar: MediaAsset | null
}

export interface ArticleDetail extends ArticleSummary {
  contentHtml: string
  updatedAt: string
  author: ArticleAuthor | null
  seo: SeoFields
}

export interface ArticlePageData {
  article: ArticleDetail
  related: ArticleSummary[]
}

export interface CategorySummary {
  id: string
  name: string
  slug: string
  description: string
  articleCount: number
}

export interface CategoryDetail extends Omit<CategorySummary, 'articleCount'> {
  seo: SeoFields
  updatedAt: string
}

export interface AdminArticleListItem {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  publishedAt: string | null
  updatedAt: string
  categories: CategoryRef[]
}

export interface AdminArticle {
  id: string
  title: string
  slug: string
  excerpt: string
  contentJson: Record<string, unknown>
  contentHtml: string
  status: 'draft' | 'published'
  publishedAt: string | null
  updatedAt: string
  cover: MediaAsset | null
  categoryIds: string[]
  seo: SeoFields
}

export interface PageBlock {
  id: string
  type: string
  props: Record<string, unknown>
  isVisible: boolean
}

export interface ServiceCard {
  id: string
  name: string
  slug: string
  summary: string
  icon: string
}

export interface PricingCell {
  type: 'check' | 'cross' | 'text'
  text: string
}

export interface PricingPlan {
  id: string
  name: string
  slug: string
  price: number
  priceSuffix: string
  description: string
  ctaLabel: string
  isPopular: boolean
}

export interface PricingFeature {
  id: string
  label: string
  group: string
  cells: Record<string, PricingCell>
}

export interface PricingGroup {
  service: ServiceCard
  plans: PricingPlan[]
  features: PricingFeature[]
}

export interface PortfolioItem {
  id: string
  title: string
  externalUrl: string
  thumbnail: MediaAsset
  service: { id: string, name: string, slug: string } | null
}

export interface ClientLogo {
  id: string
  name: string
  url: string
  logo: MediaAsset
}

export interface Testimonial {
  id: string
  authorName: string
  authorRole: string
  company: string
  quote: string
  rating: number | null
  avatar: MediaAsset | null
}

export interface Faq {
  id: string
  question: string
  answer: string
  group: string
}

export interface FormFieldDef {
  id: string
  name: string
  label: string
  type: string
  placeholder: string
  helpText: string
  options: { label: string, value: string }[]
  required: boolean
  validation: { min?: number, max?: number }
  width: 'full' | 'half'
}

export interface PublicForm {
  key: string
  name: string
  submitLabel: string
  successMessage: string
  fields: FormFieldDef[]
}

export interface BlockData {
  media: Record<string, MediaAsset>
  services: ServiceCard[]
  pricing: PricingGroup[]
  articles: Record<string, ArticleSummary[]>
  portfolio: Record<string, PortfolioItem[]>
  logos: ClientLogo[]
  testimonials: Testimonial[]
  faqs: Faq[]
  forms: Record<string, PublicForm>
}

export interface PublicPage {
  id: string
  title: string
  slug: string
  kind: 'home' | 'service' | 'static'
  updatedAt: string
  seo: SeoFields
  blocks: PageBlock[]
  data: BlockData
}

export interface ServicePageData {
  service: ServiceCard
  page: PublicPage | null
  pricing: PricingGroup | null
}

export interface AdminPageListItem {
  id: string
  title: string
  slug: string
  kind: 'home' | 'service' | 'static'
  status: 'draft' | 'published'
  updatedAt: string
  service: { id: string, name: string } | null
}

export interface AdminPage {
  id: string
  title: string
  slug: string
  kind: 'home' | 'service' | 'static'
  status: 'draft' | 'published'
  updatedAt: string
  seo: SeoFields
  blocks: PageBlock[]
  media: Record<string, MediaAsset>
}

export interface AdminService extends ServiceCard {
  isActive: boolean
  pageId: string | null
  planCount: number
}

export interface AdminPortfolioItem extends PortfolioItem {
  isActive: boolean
}

export interface AdminClientLogo extends ClientLogo {
  isActive: boolean
}

export interface AdminTestimonial extends Testimonial {
  isActive: boolean
}

export interface AdminFaq extends Faq {
  isActive: boolean
}

export interface AdminForm extends PublicForm {
  id: string
  notifyEmails: string[]
  submissionCount: number
}

export interface SubmissionListItem {
  id: string
  formKey: string
  formName: string
  name: string
  email: string
  status: 'new' | 'contacted' | 'won' | 'lost' | 'spam'
  createdAt: string
}

export interface SubmissionDetail extends SubmissionListItem {
  data: Record<string, unknown>
  note: string
  serviceSlug: string
  planSlug: string
  sourcePath: string
  userAgent: string
  fields: FormFieldDef[]
  updatedAt: string
}

export interface SubmissionCounts {
  new: number
  contacted: number
  won: number
  lost: number
  spam: number
  allButSpam: number
}

export interface PortfolioPageData {
  items: PortfolioItem[]
  services: { id: string, name: string, slug: string }[]
}

export interface AdminRedirect {
  id: string
  fromPath: string
  toPath: string
  statusCode: 301 | 302 | 308
  updatedAt: string
}
