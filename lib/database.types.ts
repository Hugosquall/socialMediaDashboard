export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      brand_kit: {
        Row: {
          accent_color: string
          created_at: string
          default_cta: string
          logo_url: string | null
          primary_color: string
          signature: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          default_cta?: string
          logo_url?: string | null
          primary_color?: string
          signature?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          default_cta?: string
          logo_url?: string | null
          primary_color?: string
          signature?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      carousel_projects: {
        Row: {
          created_at: string
          id: string
          source_type: string
          source_url: string | null
          status: string
          theme: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_type?: string
          source_url?: string | null
          status?: string
          theme?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          source_type?: string
          source_url?: string | null
          status?: string
          theme?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      carousel_slides: {
        Row: {
          body: string
          created_at: string
          headline: string
          id: string
          position: number
          project_id: string
          speaker_notes: string | null
          updated_at: string
          user_id: string
          visual_hint: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          headline: string
          id?: string
          position: number
          project_id: string
          speaker_notes?: string | null
          updated_at?: string
          user_id: string
          visual_hint?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          headline?: string
          id?: string
          position?: number
          project_id?: string
          speaker_notes?: string | null
          updated_at?: string
          user_id?: string
          visual_hint?: string | null
        }
        Relationships: []
      }
      competitor_snapshots: {
        Row: {
          avg_comments: number | null
          avg_likes: number | null
          captured_at: string
          competitor_id: string
          created_at: string
          engagement_rate: number | null
          followers: number | null
          followers_delta: number | null
          handle: string
          id: string
          notes: string | null
          platform: string
          posts_per_week: number | null
          user_id: string
        }
        Insert: {
          avg_comments?: number | null
          avg_likes?: number | null
          captured_at?: string
          competitor_id: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          followers_delta?: number | null
          handle: string
          id?: string
          notes?: string | null
          platform: string
          posts_per_week?: number | null
          user_id: string
        }
        Update: {
          avg_comments?: number | null
          avg_likes?: number | null
          captured_at?: string
          competitor_id?: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          followers_delta?: number | null
          handle?: string
          id?: string
          notes?: string | null
          platform?: string
          posts_per_week?: number | null
          user_id?: string
        }
        Relationships: []
      }
      competitors: {
        Row: {
          avg_engagement: number | null
          created_at: string | null
          followers: number | null
          id: string
          instagram_handle: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
          youtube_handle: string | null
        }
        Insert: {
          avg_engagement?: number | null
          created_at?: string | null
          followers?: number | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
          youtube_handle?: string | null
        }
        Update: {
          avg_engagement?: number | null
          created_at?: string | null
          followers?: number | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
          youtube_handle?: string | null
        }
        Relationships: []
      }
      content_memory: {
        Row: {
          body: string
          created_at: string
          id: string
          source: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          source?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          source?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      growth_experiments: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          created_at: string
          generated_prompt: string
          id: string
          input: Json
          prompt_id: string
          prompt_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          created_at?: string
          generated_prompt: string
          id?: string
          input?: Json
          prompt_id: string
          prompt_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          created_at?: string
          generated_prompt?: string
          id?: string
          input?: Json
          prompt_id?: string
          prompt_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string | null
          id: string
          instagram_user_id: string
          instagram_username: string | null
          scope: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_user_id: string
          instagram_username?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_user_id?: string
          instagram_username?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string | null
          dismissed_at: string | null
          id: string
          read_at: string | null
          time_label: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          read_at?: string | null
          time_label?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          read_at?: string | null
          time_label?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          caption: string
          comments: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          instagram_post_id: string | null
          likes: number | null
          media_url: string | null
          platform: string
          published_at: string | null
          reach: number | null
          saves: number | null
          scheduled_at: string | null
          status: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          instagram_post_id?: string | null
          likes?: number | null
          media_url?: string | null
          platform?: string
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          scheduled_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          instagram_post_id?: string | null
          likes?: number | null
          media_url?: string | null
          platform?: string
          published_at?: string | null
          reach?: number | null
          saves?: number | null
          scheduled_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string | null
          handle: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string
          created_at?: string | null
          handle?: string
          id: string
          name?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string | null
          handle?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

// ─── Helpers de conveniência ─────────────────────────────────────────────────

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]

// Tipos diretos para uso no app
export type Profile        = Tables<"profiles">
export type Post           = Tables<"posts">
export type Competitor     = Tables<"competitors">
export type InstagramToken = Tables<"instagram_tokens">
export type NotificationRecord = Tables<"notifications">
export type GrowthExperiment = Tables<"growth_experiments">
export type CompetitorSnapshot = Tables<"competitor_snapshots">
export type CarouselProject = Tables<"carousel_projects">
export type CarouselSlide = Tables<"carousel_slides">
export type BrandKit = Tables<"brand_kit">
export type ContentMemory = Tables<"content_memory">
