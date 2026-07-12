export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          metadata: Json
          path: string
          referrer: string | null
          session_id: string
          target: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          metadata?: Json
          path: string
          referrer?: string | null
          session_id: string
          target?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          metadata?: Json
          path?: string
          referrer?: string | null
          session_id?: string
          target?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      archive_redemption_catalog: {
        Row: {
          active: boolean
          category: string
          code: string
          cost_tokens: number
          created_at: string
          description: string
          id: string
          name: string
          payload: Json
        }
        Insert: {
          active?: boolean
          category: string
          code: string
          cost_tokens: number
          created_at?: string
          description?: string
          id?: string
          name: string
          payload?: Json
        }
        Update: {
          active?: boolean
          category?: string
          code?: string
          cost_tokens?: number
          created_at?: string
          description?: string
          id?: string
          name?: string
          payload?: Json
        }
        Relationships: []
      }
      archive_redemptions: {
        Row: {
          catalog_code: string
          catalog_id: string
          category: string
          cost_tokens: number
          created_at: string
          granted_months: number
          id: string
          status: string
          user_id: string
        }
        Insert: {
          catalog_code: string
          catalog_id: string
          category: string
          cost_tokens: number
          created_at?: string
          granted_months?: number
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          catalog_code?: string
          catalog_id?: string
          category?: string
          cost_tokens?: number
          created_at?: string
          granted_months?: number
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archive_redemptions_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "archive_redemption_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_wallet_ledger: {
        Row: {
          created_at: string
          delta: number
          id: string
          kind: string
          metadata: Json
          reason: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          kind: string
          metadata?: Json
          reason: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          kind?: string
          metadata?: Json
          reason?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      archive_wallets: {
        Row: {
          created_at: string
          lifetime_tokens: number
          rank: string
          tokens: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          lifetime_tokens?: number
          rank?: string
          tokens?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          lifetime_tokens?: number
          rank?: string
          tokens?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body_md: string
          cover_path: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string
          cover_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string
          cover_path?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cameo_submissions: {
        Row: {
          admin_notes: string | null
          attested_18_plus: boolean
          created_at: string
          date_of_birth: string
          display_name: string
          full_legal_name: string
          id: string
          ip: string | null
          likeness_notes: string | null
          reference_url: string | null
          release_signed: boolean
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          attested_18_plus?: boolean
          created_at?: string
          date_of_birth: string
          display_name: string
          full_legal_name: string
          id?: string
          ip?: string | null
          likeness_notes?: string | null
          reference_url?: string | null
          release_signed?: boolean
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          attested_18_plus?: boolean
          created_at?: string
          date_of_birth?: string
          display_name?: string
          full_legal_name?: string
          id?: string
          ip?: string | null
          likeness_notes?: string | null
          reference_url?: string | null
          release_signed?: boolean
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          bio: string | null
          created_at: string
          faction: string | null
          id: string
          is_published: boolean
          name: string
          portrait_path: string | null
          role: string | null
          series_id: string | null
          short_description: string | null
          slug: string
          sort_order: number
          transmedium: boolean | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          faction?: string | null
          id?: string
          is_published?: boolean
          name: string
          portrait_path?: string | null
          role?: string | null
          series_id?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          transmedium?: boolean | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          faction?: string | null
          id?: string
          is_published?: boolean
          name?: string
          portrait_path?: string | null
          role?: string | null
          series_id?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          transmedium?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "characters_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      comics: {
        Row: {
          alt_text: string | null
          author_note: string | null
          chapter_id: string | null
          created_at: string
          drop_at: string | null
          id: string
          image_path: string
          is_free: boolean
          issue_id: string | null
          page_number: number
          published_at: string | null
          slug: string
          thumbnail_path: string | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          author_note?: string | null
          chapter_id?: string | null
          created_at?: string
          drop_at?: string | null
          id?: string
          image_path: string
          is_free?: boolean
          issue_id?: string | null
          page_number: number
          published_at?: string | null
          slug: string
          thumbnail_path?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          author_note?: string | null
          chapter_id?: string | null
          created_at?: string
          drop_at?: string | null
          id?: string
          image_path?: string
          is_free?: boolean
          issue_id?: string | null
          page_number?: number
          published_at?: string | null
          slug?: string
          thumbnail_path?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comics_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comics_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      community_attestations: {
        Row: {
          attested_18_plus: boolean
          created_at: string
          date_of_birth: string
          id: string
          ip: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attested_18_plus: boolean
          created_at?: string
          date_of_birth: string
          id?: string
          ip?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attested_18_plus?: boolean
          created_at?: string
          date_of_birth?: string
          id?: string
          ip?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      dsar_requests: {
        Row: {
          authorized_agent: boolean
          created_at: string
          details: string | null
          id: string
          ip: unknown
          reference_id: string
          region: string | null
          request_type: string
          requester_email: string
          response_notes: string | null
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          verification_status: string
        }
        Insert: {
          authorized_agent?: boolean
          created_at?: string
          details?: string | null
          id?: string
          ip?: unknown
          reference_id?: string
          region?: string | null
          request_type: string
          requester_email: string
          response_notes?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_status?: string
        }
        Update: {
          authorized_agent?: boolean
          created_at?: string
          details?: string | null
          id?: string
          ip?: unknown
          reference_id?: string
          region?: string | null
          request_type?: string
          requester_email?: string
          response_notes?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      factions: {
        Row: {
          acro: string | null
          bio: string | null
          created_at: string
          emblem_path: string | null
          id: string
          name: string
          series_id: string
          slug: string
          sort_order: number
          summary: string | null
        }
        Insert: {
          acro?: string | null
          bio?: string | null
          created_at?: string
          emblem_path?: string | null
          id?: string
          name: string
          series_id: string
          slug: string
          sort_order?: number
          summary?: string | null
        }
        Update: {
          acro?: string | null
          bio?: string | null
          created_at?: string
          emblem_path?: string | null
          id?: string
          name?: string
          series_id?: string
          slug?: string
          sort_order?: number
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "factions_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_kpis: {
        Row: {
          cac: number | null
          churn: number | null
          created_at: string
          discord: number | null
          emails: number | null
          ewr: number | null
          id: string
          mrr: number | null
          notes: string | null
          nps: number | null
          recorded_at: string
          subs: number | null
        }
        Insert: {
          cac?: number | null
          churn?: number | null
          created_at?: string
          discord?: number | null
          emails?: number | null
          ewr?: number | null
          id?: string
          mrr?: number | null
          notes?: string | null
          nps?: number | null
          recorded_at?: string
          subs?: number | null
        }
        Update: {
          cac?: number | null
          churn?: number | null
          created_at?: string
          discord?: number | null
          emails?: number | null
          ewr?: number | null
          id?: string
          mrr?: number | null
          notes?: string | null
          nps?: number | null
          recorded_at?: string
          subs?: number | null
        }
        Relationships: []
      }
      growth_sprint_weeks: {
        Row: {
          created_at: string
          dates: string
          done: boolean
          done_at: string | null
          id: string
          outcome: string
          updated_at: string
          week: number
        }
        Insert: {
          created_at?: string
          dates: string
          done?: boolean
          done_at?: string | null
          id?: string
          outcome: string
          updated_at?: string
          week: number
        }
        Update: {
          created_at?: string
          dates?: string
          done?: boolean
          done_at?: string | null
          id?: string
          outcome?: string
          updated_at?: string
          week?: number
        }
        Relationships: []
      }
      issue_drops: {
        Row: {
          id: string
          issue_id: string
          pages: number[]
          patron_date: string
          reader_date: string
          week: number
        }
        Insert: {
          id?: string
          issue_id: string
          pages: number[]
          patron_date: string
          reader_date: string
          week: number
        }
        Update: {
          id?: string
          issue_id?: string
          pages?: number[]
          patron_date?: string
          reader_date?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "issue_drops_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          cover_path: string | null
          created_at: string
          drop_cadence: string | null
          free_pages: number
          id: string
          internal_identifier: string | null
          issue_number: number
          paid_pages: number
          paid_release_end: string | null
          paid_release_start: string | null
          publication_year: number
          release_status: string | null
          series_id: string
          slug: string
          subtitle: string | null
          title: string
          total_pages: number
          updated_at: string
          variant_cover_paths: string[] | null
          volume: number
        }
        Insert: {
          cover_path?: string | null
          created_at?: string
          drop_cadence?: string | null
          free_pages?: number
          id?: string
          internal_identifier?: string | null
          issue_number: number
          paid_pages?: number
          paid_release_end?: string | null
          paid_release_start?: string | null
          publication_year?: number
          release_status?: string | null
          series_id: string
          slug: string
          subtitle?: string | null
          title: string
          total_pages?: number
          updated_at?: string
          variant_cover_paths?: string[] | null
          volume?: number
        }
        Update: {
          cover_path?: string | null
          created_at?: string
          drop_cadence?: string | null
          free_pages?: number
          id?: string
          internal_identifier?: string | null
          issue_number?: number
          paid_pages?: number
          paid_release_end?: string | null
          paid_release_start?: string | null
          publication_year?: number
          release_status?: string | null
          series_id?: string
          slug?: string
          subtitle?: string | null
          title?: string
          total_pages?: number
          updated_at?: string
          variant_cover_paths?: string[] | null
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "issues_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          confirm_token: string
          confirmed: boolean
          created_at: string
          email: string
          id: string
          last_page: number | null
          notified_at: string | null
          series_slug: string | null
          source: string
          unsub_token: string
          updated_at: string
        }
        Insert: {
          confirm_token?: string
          confirmed?: boolean
          created_at?: string
          email: string
          id?: string
          last_page?: number | null
          notified_at?: string | null
          series_slug?: string | null
          source: string
          unsub_token?: string
          updated_at?: string
        }
        Update: {
          confirm_token?: string
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: string
          last_page?: number | null
          notified_at?: string | null
          series_slug?: string | null
          source?: string
          unsub_token?: string
          updated_at?: string
        }
        Relationships: []
      }
      letter_comments: {
        Row: {
          body: string
          created_at: string
          display_name: string
          hidden: boolean
          id: string
          letter_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name: string
          hidden?: boolean
          id?: string
          letter_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          hidden?: boolean
          id?: string
          letter_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letter_comments_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "letters"
            referencedColumns: ["id"]
          },
        ]
      }
      letters: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          created_at: string
          display_name: string
          editor_reply: string | null
          feature_order: number | null
          id: string
          issue_id: string
          location: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          created_at?: string
          display_name: string
          editor_reply?: string | null
          feature_order?: number | null
          id?: string
          issue_id: string
          location?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          created_at?: string
          display_name?: string
          editor_reply?: string | null
          feature_order?: number | null
          id?: string
          issue_id?: string
          location?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          current_count: number
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          rewards: Json
          slug: string
          target_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_count?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          rewards?: Json
          slug: string
          target_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_count?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rewards?: Json
          slug?: string
          target_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      raffle_entries: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source: string
          tier: string | null
          user_id: string | null
          week_key: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source: string
          tier?: string | null
          user_id?: string | null
          week_key: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string
          tier?: string | null
          user_id?: string | null
          week_key?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actor_ip: string | null
          actor_user_id: string | null
          created_at: string
          details: Json
          id: string
          kind: string
          severity: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actor_ip?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind: string
          severity?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actor_ip?: string | null
          actor_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          severity?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          comp_titles: string[] | null
          cover_path: string | null
          created_at: string
          genre: string | null
          id: string
          issn: string | null
          launch_label: string | null
          logline: string | null
          logo_path: string | null
          name: string
          slug: string
          sort_order: number
          status: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          comp_titles?: string[] | null
          cover_path?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          issn?: string | null
          launch_label?: string | null
          logline?: string | null
          logo_path?: string | null
          name: string
          slug: string
          sort_order?: number
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          comp_titles?: string[] | null
          cover_path?: string | null
          created_at?: string
          genre?: string | null
          id?: string
          issn?: string | null
          launch_label?: string | null
          logline?: string | null
          logo_path?: string | null
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_copy: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_stats: {
        Row: {
          campaign_goal: number
          id: number
          pages_published: number
          series_live: number
          subscriber_count: number
          updated_at: string
        }
        Insert: {
          campaign_goal?: number
          id?: number
          pages_published?: number
          series_live?: number
          subscriber_count?: number
          updated_at?: string
        }
        Update: {
          campaign_goal?: number
          id?: number
          pages_published?: number
          series_live?: number
          subscriber_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      storage_access_logs: {
        Row: {
          bucket: string
          comic_id: string | null
          created_at: string
          id: string
          ip: string | null
          is_free: boolean | null
          path: string
          referer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bucket?: string
          comic_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          is_free?: boolean | null
          path: string
          referer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bucket?: string
          comic_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          is_free?: boolean | null
          path?: string
          referer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          active: boolean
          confirmed: boolean
          created_at: string
          email: string
          id: string
          tier: Database["public"]["Enums"]["sub_tier"] | null
          user_id: string | null
        }
        Insert: {
          active?: boolean
          confirmed?: boolean
          created_at?: string
          email: string
          id?: string
          tier?: Database["public"]["Enums"]["sub_tier"] | null
          user_id?: string | null
        }
        Update: {
          active?: boolean
          confirmed?: boolean
          created_at?: string
          email?: string
          id?: string
          tier?: Database["public"]["Enums"]["sub_tier"] | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          shipping_city: string | null
          shipping_country: string | null
          shipping_line1: string | null
          shipping_line2: string | null
          shipping_name: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_line1?: string | null
          shipping_line2?: string | null
          shipping_name?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_line1?: string | null
          shipping_line2?: string | null
          shipping_name?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_hits: {
        Row: {
          country: string | null
          created_at: string
          id: string
          ip: string | null
          ip_hash: string | null
          path: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          ip_hash?: string | null
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          ip_hash?: string | null
          path?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_redeem: {
        Args: { p_catalog_id: string }
        Returns: {
          catalog_code: string
          catalog_id: string
          category: string
          cost_tokens: number
          created_at: string
          granted_months: number
          id: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "archive_redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      archive_subscription_months_used: {
        Args: { p_user: string }
        Returns: number
      }
      detect_storage_access_bursts: {
        Args: { threshold?: number; window_seconds?: number }
        Returns: number
      }
      get_active_subscriber_count: { Args: never; Returns: number }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_any_active_subscription: {
        Args: { p_user: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_is_concluded: { Args: { p_issue: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      sub_tier: "reader" | "initiate" | "patron"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      sub_tier: ["reader", "initiate", "patron"],
    },
  },
} as const
