
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "admin_profiles": {
                  Row: {
                    "avatar_media_id": string | null,"bio": string,"created_at": string,"display_name": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_media_id"?: string | null,"bio"?: string,"created_at"?: string,"display_name": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "avatar_media_id"?: string | null,"bio"?: string,"created_at"?: string,"display_name"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_profiles_avatar_media_id_fkey"
      columns: ["avatar_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"article_categories": {
                  Row: {
                    "article_id": string,"category_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "article_id": string,"category_id": string
                  }
                  Update: {
                    "article_id"?: string,"category_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "article_categories_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "v_category_counts"
      referencedColumns: ["id"]
    }
                  ]
                },"articles": {
                  Row: {
                    "canonical_url": string,"content_html": string,"content_json": NonNullable<Json>,"cover_media_id": string | null,"created_at": string,"excerpt": string,"id": string,"meta_description": string,"meta_keywords": (string)[],"meta_title": string,"noindex": boolean,"og_media_id": string | null,"published_at": string | null,"reading_minutes": number,"search": unknown,"slug": string,"status": string,"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "canonical_url"?: string,"content_html"?: string,"content_json"?: NonNullable<Json>,"cover_media_id"?: string | null,"created_at"?: string,"excerpt"?: string,"id"?: string,"meta_description"?: string,"meta_keywords"?: (string)[],"meta_title"?: string,"noindex"?: boolean,"og_media_id"?: string | null,"published_at"?: string | null,"reading_minutes"?: number,"search"?: never,"slug": string,"status"?: string,"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "canonical_url"?: string,"content_html"?: string,"content_json"?: NonNullable<Json>,"cover_media_id"?: string | null,"created_at"?: string,"excerpt"?: string,"id"?: string,"meta_description"?: string,"meta_keywords"?: (string)[],"meta_title"?: string,"noindex"?: boolean,"og_media_id"?: string | null,"published_at"?: string | null,"reading_minutes"?: number,"search"?: never,"slug"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_cover_media_id_fkey"
      columns: ["cover_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_og_media_id_fkey"
      columns: ["og_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "canonical_url": string,"created_at": string,"description": string,"id": string,"meta_description": string,"meta_keywords": (string)[],"meta_title": string,"name": string,"noindex": boolean,"og_media_id": string | null,"slug": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "canonical_url"?: string,"created_at"?: string,"description"?: string,"id"?: string,"meta_description"?: string,"meta_keywords"?: (string)[],"meta_title"?: string,"name": string,"noindex"?: boolean,"og_media_id"?: string | null,"slug": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "canonical_url"?: string,"created_at"?: string,"description"?: string,"id"?: string,"meta_description"?: string,"meta_keywords"?: (string)[],"meta_title"?: string,"name"?: string,"noindex"?: boolean,"og_media_id"?: string | null,"slug"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_og_media_id_fkey"
      columns: ["og_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"client_logos": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"logo_media_id": string,"name": string,"position": number,"updated_at": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"logo_media_id": string,"name": string,"position"?: number,"updated_at"?: string,"url"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"logo_media_id"?: string,"name"?: string,"position"?: number,"updated_at"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_logos_logo_media_id_fkey"
      columns: ["logo_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"faqs": {
                  Row: {
                    "answer": string,"created_at": string,"group_label": string,"id": string,"is_active": boolean,"position": number,"question": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": string,"created_at"?: string,"group_label"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"question": string,"updated_at"?: string
                  }
                  Update: {
                    "answer"?: string,"created_at"?: string,"group_label"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"question"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"form_fields": {
                  Row: {
                    "created_at": string,"form_id": string,"help_text": string,"id": string,"label": string,"name": string,"options": NonNullable<Json>,"placeholder": string,"position": number,"required": boolean,"type": string,"updated_at": string,"validation": NonNullable<Json>,"width": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"form_id": string,"help_text"?: string,"id"?: string,"label": string,"name": string,"options"?: NonNullable<Json>,"placeholder"?: string,"position"?: number,"required"?: boolean,"type": string,"updated_at"?: string,"validation"?: NonNullable<Json>,"width"?: string
                  }
                  Update: {
                    "created_at"?: string,"form_id"?: string,"help_text"?: string,"id"?: string,"label"?: string,"name"?: string,"options"?: NonNullable<Json>,"placeholder"?: string,"position"?: number,"required"?: boolean,"type"?: string,"updated_at"?: string,"validation"?: NonNullable<Json>,"width"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "form_fields_form_id_fkey"
      columns: ["form_id"]
isOneToOne: false
      referencedRelation: "forms"
      referencedColumns: ["id"]
    }
                  ]
                },"forms": {
                  Row: {
                    "created_at": string,"id": string,"key": string,"name": string,"notify_emails": (string)[],"submit_label": string,"success_message": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"key": string,"name": string,"notify_emails"?: (string)[],"submit_label"?: string,"success_message"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"key"?: string,"name"?: string,"notify_emails"?: (string)[],"submit_label"?: string,"success_message"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"media": {
                  Row: {
                    "alt": string,"blurhash": string | null,"bucket": string,"created_at": string,"height": number | null,"id": string,"mime": string,"path": string,"size_bytes": number,"updated_at": string,"updated_by": string | null,"variants": NonNullable<Json>,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string,"blurhash"?: string | null,"bucket"?: string,"created_at"?: string,"height"?: number | null,"id"?: string,"mime": string,"path": string,"size_bytes": number,"updated_at"?: string,"updated_by"?: string | null,"variants"?: NonNullable<Json>,"width"?: number | null
                  }
                  Update: {
                    "alt"?: string,"blurhash"?: string | null,"bucket"?: string,"created_at"?: string,"height"?: number | null,"id"?: string,"mime"?: string,"path"?: string,"size_bytes"?: number,"updated_at"?: string,"updated_by"?: string | null,"variants"?: NonNullable<Json>,"width"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"page_blocks": {
                  Row: {
                    "created_at": string,"id": string,"is_visible": boolean,"page_id": string,"position": number,"props": NonNullable<Json>,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_visible"?: boolean,"page_id": string,"position"?: number,"props"?: NonNullable<Json>,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_visible"?: boolean,"page_id"?: string,"position"?: number,"props"?: NonNullable<Json>,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "page_blocks_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "pages"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "canonical_url": string,"created_at": string,"id": string,"kind": string,"meta_description": string,"meta_keywords": (string)[],"meta_title": string,"noindex": boolean,"og_media_id": string | null,"slug": string,"status": string,"title": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "canonical_url"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"meta_description"?: string,"meta_keywords"?: (string)[],"meta_title"?: string,"noindex"?: boolean,"og_media_id"?: string | null,"slug": string,"status"?: string,"title": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "canonical_url"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"meta_description"?: string,"meta_keywords"?: (string)[],"meta_title"?: string,"noindex"?: boolean,"og_media_id"?: string | null,"slug"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pages_og_media_id_fkey"
      columns: ["og_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"portfolio_items": {
                  Row: {
                    "created_at": string,"external_url": string,"id": string,"is_active": boolean,"position": number,"service_id": string | null,"thumbnail_media_id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"external_url": string,"id"?: string,"is_active"?: boolean,"position"?: number,"service_id"?: string | null,"thumbnail_media_id": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"external_url"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"service_id"?: string | null,"thumbnail_media_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "portfolio_items_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "portfolio_items_thumbnail_media_id_fkey"
      columns: ["thumbnail_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"pricing_features": {
                  Row: {
                    "created_at": string,"group_label": string,"id": string,"label": string,"position": number,"service_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"group_label"?: string,"id"?: string,"label": string,"position"?: number,"service_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"group_label"?: string,"id"?: string,"label"?: string,"position"?: number,"service_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pricing_features_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"pricing_plan_features": {
                  Row: {
                    "feature_id": string,"plan_id": string,"value_text": string,"value_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "feature_id": string,"plan_id": string,"value_text"?: string,"value_type"?: string
                  }
                  Update: {
                    "feature_id"?: string,"plan_id"?: string,"value_text"?: string,"value_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pricing_plan_features_feature_id_fkey"
      columns: ["feature_id"]
isOneToOne: false
      referencedRelation: "pricing_features"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pricing_plan_features_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "pricing_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"pricing_plans": {
                  Row: {
                    "created_at": string,"cta_form_id": string | null,"cta_label": string,"description": string,"id": string,"is_popular": boolean,"name": string,"position": number,"price": number,"price_suffix": string,"service_id": string,"slug": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"cta_form_id"?: string | null,"cta_label"?: string,"description"?: string,"id"?: string,"is_popular"?: boolean,"name": string,"position"?: number,"price"?: number,"price_suffix"?: string,"service_id": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"cta_form_id"?: string | null,"cta_label"?: string,"description"?: string,"id"?: string,"is_popular"?: boolean,"name"?: string,"position"?: number,"price"?: number,"price_suffix"?: string,"service_id"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pricing_plans_cta_form_id_fkey"
      columns: ["cta_form_id"]
isOneToOne: false
      referencedRelation: "forms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pricing_plans_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "services"
      referencedColumns: ["id"]
    }
                  ]
                },"redirects": {
                  Row: {
                    "created_at": string,"from_path": string,"id": string,"status_code": number,"to_path": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"from_path": string,"id"?: string,"status_code"?: number,"to_path": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"from_path"?: string,"id"?: string,"status_code"?: number,"to_path"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"services": {
                  Row: {
                    "created_at": string,"icon": string,"id": string,"is_active": boolean,"name": string,"page_id": string | null,"position": number,"slug": string,"summary": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"icon"?: string,"id"?: string,"is_active"?: boolean,"name": string,"page_id"?: string | null,"position"?: number,"slug": string,"summary"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"icon"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"page_id"?: string | null,"position"?: number,"slug"?: string,"summary"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "pages"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "address": string,"default_og_media_id": string | null,"description": string,"email": string,"favicon_media_id": string | null,"id": number,"logo_dark_media_id": string | null,"logo_light_media_id": string | null,"map_url": string,"marquee": NonNullable<Json>,"phone": string,"site_name": string,"tagline": string,"timezone": string,"title_template": string,"umami_script_url": string,"umami_website_id": string,"updated_at": string,"updated_by": string | null,"whatsapp_message": string,"whatsapp_number": string,"work_hours": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"default_og_media_id"?: string | null,"description"?: string,"email"?: string,"favicon_media_id"?: string | null,"id"?: number,"logo_dark_media_id"?: string | null,"logo_light_media_id"?: string | null,"map_url"?: string,"marquee"?: NonNullable<Json>,"phone"?: string,"site_name"?: string,"tagline"?: string,"timezone"?: string,"title_template"?: string,"umami_script_url"?: string,"umami_website_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"whatsapp_message"?: string,"whatsapp_number"?: string,"work_hours"?: NonNullable<Json>
                  }
                  Update: {
                    "address"?: string,"default_og_media_id"?: string | null,"description"?: string,"email"?: string,"favicon_media_id"?: string | null,"id"?: number,"logo_dark_media_id"?: string | null,"logo_light_media_id"?: string | null,"map_url"?: string,"marquee"?: NonNullable<Json>,"phone"?: string,"site_name"?: string,"tagline"?: string,"timezone"?: string,"title_template"?: string,"umami_script_url"?: string,"umami_website_id"?: string,"updated_at"?: string,"updated_by"?: string | null,"whatsapp_message"?: string,"whatsapp_number"?: string,"work_hours"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_default_og_media_id_fkey"
      columns: ["default_og_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_settings_favicon_media_id_fkey"
      columns: ["favicon_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_settings_logo_dark_media_id_fkey"
      columns: ["logo_dark_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_settings_logo_light_media_id_fkey"
      columns: ["logo_light_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                },"social_links": {
                  Row: {
                    "created_at": string,"icon": string,"id": string,"is_active": boolean,"label": string,"platform": string,"position": number,"updated_at": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"icon": string,"id"?: string,"is_active"?: boolean,"label": string,"platform": string,"position"?: number,"updated_at"?: string,"url": string
                  }
                  Update: {
                    "created_at"?: string,"icon"?: string,"id"?: string,"is_active"?: boolean,"label"?: string,"platform"?: string,"position"?: number,"updated_at"?: string,"url"?: string
                  }
                  Relationships: [
                    
                  ]
                },"submissions": {
                  Row: {
                    "created_at": string,"data": NonNullable<Json>,"email": string,"form_id": string,"id": string,"ip_hash": string,"name": string,"note": string,"source_path": string,"status": string,"updated_at": string,"user_agent": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"data": NonNullable<Json>,"email"?: string,"form_id": string,"id"?: string,"ip_hash"?: string,"name"?: string,"note"?: string,"source_path"?: string,"status"?: string,"updated_at"?: string,"user_agent"?: string
                  }
                  Update: {
                    "created_at"?: string,"data"?: NonNullable<Json>,"email"?: string,"form_id"?: string,"id"?: string,"ip_hash"?: string,"name"?: string,"note"?: string,"source_path"?: string,"status"?: string,"updated_at"?: string,"user_agent"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "submissions_form_id_fkey"
      columns: ["form_id"]
isOneToOne: false
      referencedRelation: "forms"
      referencedColumns: ["id"]
    }
                  ]
                },"testimonials": {
                  Row: {
                    "author_name": string,"author_role": string,"avatar_media_id": string | null,"company": string,"created_at": string,"id": string,"is_active": boolean,"position": number,"quote": string,"rating": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"author_role"?: string,"avatar_media_id"?: string | null,"company"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"quote": string,"rating"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "author_name"?: string,"author_role"?: string,"avatar_media_id"?: string | null,"company"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"position"?: number,"quote"?: string,"rating"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "testimonials_avatar_media_id_fkey"
      columns: ["avatar_media_id"]
isOneToOne: false
      referencedRelation: "media"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_category_counts": {
                  Row: {
                    "article_count": number | null,"id": string | null,"name": string | null,"slug": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_dashboard_stats": {
                  Row: {
                    "draft_articles": number | null,"media_files": number | null,"new_submissions": number | null,"published_articles": number | null,"submissions_30d": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "fn_is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"fn_related_articles":
{ Args: { "p_article_id": string,"p_limit"?: number }; Returns: {
              "canonical_url": string,
"content_html": string,
"content_json": NonNullable<Json>,
"cover_media_id": string | null,
"created_at": string,
"excerpt": string,
"id": string,
"meta_description": string,
"meta_keywords": (string)[],
"meta_title": string,
"noindex": boolean,
"og_media_id": string | null,
"published_at": string | null,
"reading_minutes": number,
"search": unknown,
"slug": string,
"status": string,
"title": string,
"updated_at": string,
"updated_by": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "articles"
        isOneToOne: false
        isSetofReturn: true
      } },
"fn_search_articles":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query": string }; Returns: {
              "id": string,"rank": number,"total_count": number
            }[]
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
