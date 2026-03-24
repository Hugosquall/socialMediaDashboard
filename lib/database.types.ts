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
