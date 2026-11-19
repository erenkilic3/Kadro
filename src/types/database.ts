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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      evaluations: {
        Row: {
          badges: string[]
          comment: string | null
          created_at: string
          evaluator_id: string
          evaluator_name: string
          fair_play_rating: number
          id: string
          is_opponent: boolean
          match_id: string
          match_title: string
          skill_rating: number
          target_player_id: string
          target_player_name: string
          target_player_position: string | null
        }
        Insert: {
          badges?: string[]
          comment?: string | null
          created_at?: string
          evaluator_id: string
          evaluator_name: string
          fair_play_rating: number
          id?: string
          is_opponent?: boolean
          match_id: string
          match_title: string
          skill_rating: number
          target_player_id: string
          target_player_name: string
          target_player_position?: string | null
        }
        Update: {
          badges?: string[]
          comment?: string | null
          created_at?: string
          evaluator_id?: string
          evaluator_name?: string
          fair_play_rating?: number
          id?: string
          is_opponent?: boolean
          match_id?: string
          match_title?: string
          skill_rating?: number
          target_player_id?: string
          target_player_name?: string
          target_player_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_target_player_id_fkey"
            columns: ["target_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gear_items: {
        Row: {
          brand: string
          category: string
          city: string
          condition: string
          created_at: string
          description: string
          district: string
          icon_name: string | null
          id: string
          image_url: string | null
          location: string
          price: number
          seller_id: string
          seller_name: string
          seller_phone: string | null
          size: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          brand: string
          category: string
          city?: string
          condition: string
          created_at?: string
          description: string
          district?: string
          icon_name?: string | null
          id?: string
          image_url?: string | null
          location: string
          price: number
          seller_id: string
          seller_name: string
          seller_phone?: string | null
          size: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          city?: string
          condition?: string
          created_at?: string
          description?: string
          district?: string
          icon_name?: string | null
          id?: string
          image_url?: string | null
          location?: string
          price?: number
          seller_id?: string
          seller_name?: string
          seller_phone?: string | null
          size?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gear_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          match_id: string
          message: string | null
          position: string
          requester_fair_play: number
          requester_id: string
          requester_name: string
          requester_rating: number
          responded_at: string | null
          slot_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          message?: string | null
          position: string
          requester_fair_play?: number
          requester_id: string
          requester_name: string
          requester_rating?: number
          responded_at?: string | null
          slot_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          message?: string | null
          position?: string
          requester_fair_play?: number
          requester_id?: string
          requester_name?: string
          requester_rating?: number
          responded_at?: string | null
          slot_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "roster_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      league_fixtures: {
        Row: {
          away_league_team_id: string | null
          away_score: number | null
          away_team_name: string
          created_at: string
          date_label: string
          home_league_team_id: string | null
          home_score: number | null
          home_team_name: string
          id: string
          is_finished: boolean
          league_id: string
          time_label: string
          updated_at: string
          venue: string
          week: number
        }
        Insert: {
          away_league_team_id?: string | null
          away_score?: number | null
          away_team_name: string
          created_at?: string
          date_label: string
          home_league_team_id?: string | null
          home_score?: number | null
          home_team_name: string
          id?: string
          is_finished?: boolean
          league_id: string
          time_label: string
          updated_at?: string
          venue: string
          week: number
        }
        Update: {
          away_league_team_id?: string | null
          away_score?: number | null
          away_team_name?: string
          created_at?: string
          date_label?: string
          home_league_team_id?: string | null
          home_score?: number | null
          home_team_name?: string
          id?: string
          is_finished?: boolean
          league_id?: string
          time_label?: string
          updated_at?: string
          venue?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_fixtures_away_league_team_id_fkey"
            columns: ["away_league_team_id"]
            isOneToOne: false
            referencedRelation: "league_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_fixtures_home_league_team_id_fkey"
            columns: ["home_league_team_id"]
            isOneToOne: false
            referencedRelation: "league_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_fixtures_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_teams: {
        Row: {
          captain_id: string | null
          captain_name: string
          captain_phone: string | null
          created_at: string
          drawn: number
          form: string[]
          goal_difference: number
          goals_against: number
          goals_for: number
          id: string
          league_id: string
          logo_emoji: string
          lost: number
          name: string
          played: number
          points: number
          team_id: string | null
          updated_at: string
          won: number
        }
        Insert: {
          captain_id?: string | null
          captain_name: string
          captain_phone?: string | null
          created_at?: string
          drawn?: number
          form?: string[]
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          id?: string
          league_id: string
          logo_emoji?: string
          lost?: number
          name: string
          played?: number
          points?: number
          team_id?: string | null
          updated_at?: string
          won?: number
        }
        Update: {
          captain_id?: string | null
          captain_name?: string
          captain_phone?: string | null
          created_at?: string
          drawn?: number
          form?: string[]
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          id?: string
          league_id?: string
          logo_emoji?: string
          lost?: number
          name?: string
          played?: number
          points?: number
          team_id?: string | null
          updated_at?: string
          won?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_teams_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          city: string
          created_at: string
          description: string
          district: string
          entry_fee: number
          format: string
          id: string
          max_teams: number
          organizer_id: string
          organizer_name: string
          organizer_phone: string | null
          prize: string
          registered_teams_count: number
          rules: string[]
          season: string
          status: string
          theme_color: string
          title: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          city?: string
          created_at?: string
          description: string
          district: string
          entry_fee?: number
          format: string
          id?: string
          max_teams: number
          organizer_id: string
          organizer_name: string
          organizer_phone?: string | null
          prize: string
          registered_teams_count?: number
          rules?: string[]
          season: string
          status?: string
          theme_color?: string
          title: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string
          district?: string
          entry_fee?: number
          format?: string
          id?: string
          max_teams?: number
          organizer_id?: string
          organizer_name?: string
          organizer_phone?: string | null
          prize?: string
          registered_teams_count?: number
          rules?: string[]
          season?: string
          status?: string
          theme_color?: string
          title?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_prediction_votes: {
        Row: {
          choice: string
          created_at: string
          id: string
          match_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          choice: string
          created_at?: string
          id?: string
          match_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          choice?: string
          created_at?: string
          id?: string
          match_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_prediction_votes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_prediction_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          address: string
          city: string
          created_at: string
          date_label: string
          district: string
          fee_per_player: number
          final_score_team1: number | null
          final_score_team2: number | null
          format: string
          id: string
          is_completed: boolean
          matchup_stats: Json | null
          missing_positions: string[]
          notes: string | null
          organizer_id: string
          organizer_name: string
          organizer_phone: string | null
          pitch_type: string
          prediction_category: string
          status: string
          team1_name: string
          team2_name: string
          time_range: string
          title: string
          total_slots: number
          updated_at: string
          venue_id: string | null
          venue_name: string
        }
        Insert: {
          address: string
          city?: string
          created_at?: string
          date_label: string
          district: string
          fee_per_player: number
          final_score_team1?: number | null
          final_score_team2?: number | null
          format: string
          id?: string
          is_completed?: boolean
          matchup_stats?: Json | null
          missing_positions?: string[]
          notes?: string | null
          organizer_id: string
          organizer_name: string
          organizer_phone?: string | null
          pitch_type: string
          prediction_category?: string
          status?: string
          team1_name?: string
          team2_name?: string
          time_range: string
          title: string
          total_slots: number
          updated_at?: string
          venue_id?: string | null
          venue_name: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          date_label?: string
          district?: string
          fee_per_player?: number
          final_score_team1?: number | null
          final_score_team2?: number | null
          format?: string
          id?: string
          is_completed?: boolean
          matchup_stats?: Json | null
          missing_positions?: string[]
          notes?: string | null
          organizer_id?: string
          organizer_name?: string
          organizer_phone?: string | null
          pitch_type?: string
          prediction_category?: string
          status?: string
          team1_name?: string
          team2_name?: string
          time_range?: string
          title?: string
          total_slots?: number
          updated_at?: string
          venue_id?: string | null
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contacts: {
        Row: {
          created_at: string
          email: string | null
          expo_push_token: string | null
          phone: string | null
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          phone?: string | null
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          expo_push_token?: string | null
          phone?: string | null
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badges: Json
          bio: string | null
          city: string
          correct_predictions: number
          created_at: string
          district: string
          evaluations_count: number
          fair_play_rating: number
          id: string
          matches_played: number
          name: string
          position: string
          prediction_score: number
          preferred_foot: string
          rating: number
          total_predictions: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          badges?: Json
          bio?: string | null
          city?: string
          correct_predictions?: number
          created_at?: string
          district?: string
          evaluations_count?: number
          fair_play_rating?: number
          id: string
          matches_played?: number
          name: string
          position?: string
          prediction_score?: number
          preferred_foot?: string
          rating?: number
          total_predictions?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          badges?: Json
          bio?: string | null
          city?: string
          correct_predictions?: number
          created_at?: string
          district?: string
          evaluations_count?: number
          fair_play_rating?: number
          id?: string
          matches_played?: number
          name?: string
          position?: string
          prediction_score?: number
          preferred_foot?: string
          rating?: number
          total_predictions?: number
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_slots: {
        Row: {
          assigned_player_fair_play: number | null
          assigned_player_id: string | null
          assigned_player_name: string | null
          assigned_player_rating: number | null
          id: string
          is_filled: boolean
          is_organizer: boolean
          match_id: string
          position: string
          slot_order: number
          team_side: number
          updated_at: string
        }
        Insert: {
          assigned_player_fair_play?: number | null
          assigned_player_id?: string | null
          assigned_player_name?: string | null
          assigned_player_rating?: number | null
          id?: string
          is_filled?: boolean
          is_organizer?: boolean
          match_id: string
          position: string
          slot_order: number
          team_side?: number
          updated_at?: string
        }
        Update: {
          assigned_player_fair_play?: number | null
          assigned_player_id?: string | null
          assigned_player_name?: string | null
          assigned_player_rating?: number | null
          id?: string
          is_filled?: boolean
          is_organizer?: boolean
          match_id?: string
          position?: string
          slot_order?: number
          team_side?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_slots_assigned_player_id_fkey"
            columns: ["assigned_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_slots_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          player_id: string
          role: string
          team_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          player_id: string
          role?: string
          team_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          player_id?: string
          role?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          bio: string | null
          captain_id: string
          city: string
          created_at: string
          district: string
          format: string
          id: string
          logo_emoji: string
          name: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          captain_id: string
          city?: string
          created_at?: string
          district?: string
          format?: string
          id?: string
          logo_emoji?: string
          name: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          captain_id?: string
          city?: string
          created_at?: string
          district?: string
          format?: string
          id?: string
          logo_emoji?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_evaluations: {
        Row: {
          comment: string | null
          created_at: string
          evaluator_id: string
          evaluator_name: string
          highlights: string[]
          id: string
          lighting_rating: number
          locker_room_rating: number
          match_id: string
          organization_rating: number
          overall_rating: number
          turf_rating: number
          venue_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          evaluator_id: string
          evaluator_name: string
          highlights?: string[]
          id?: string
          lighting_rating: number
          locker_room_rating: number
          match_id: string
          organization_rating: number
          overall_rating: number
          turf_rating: number
          venue_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          evaluator_id?: string
          evaluator_name?: string
          highlights?: string[]
          id?: string
          lighting_rating?: number
          locker_room_rating?: number
          match_id?: string
          organization_rating?: number
          overall_rating?: number
          turf_rating?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_evaluations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_evaluations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          amenities: string[]
          city: string
          created_at: string
          district: string
          evaluations_count: number
          id: string
          lighting_rating: number
          locker_room_rating: number
          name: string
          organization_rating: number
          overall_rating: number
          pitch_type: string
          turf_rating: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          city?: string
          created_at?: string
          district?: string
          evaluations_count?: number
          id?: string
          lighting_rating?: number
          locker_room_rating?: number
          name: string
          organization_rating?: number
          overall_rating?: number
          pitch_type?: string
          turf_rating?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[]
          city?: string
          created_at?: string
          district?: string
          evaluations_count?: number
          id?: string
          lighting_rating?: number
          locker_room_rating?: number
          name?: string
          organization_rating?: number
          overall_rating?: number
          pitch_type?: string
          turf_rating?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_join_request: { Args: { p_request_id: string }; Returns: boolean }
      cast_match_prediction_vote: {
        Args: { p_choice: string; p_match_id: string }
        Returns: boolean
      }
      complete_match_atomic: {
        Args: {
          p_match_id: string
          p_score_team1: number
          p_score_team2: number
        }
        Returns: boolean
      }
      join_match_slot_atomic: {
        Args: { p_match_id: string; p_slot_id: string }
        Returns: boolean
      }
      leave_match_atomic: { Args: { p_match_id: string }; Returns: boolean }
      record_league_fixture_result: {
        Args: {
          p_away_score: number
          p_fixture_id: string
          p_home_score: number
        }
        Returns: boolean
      }
      register_team_to_league: {
        Args: {
          p_captain_name: string
          p_captain_phone?: string
          p_league_id: string
          p_team_id?: string
          p_team_name: string
        }
        Returns: string
      }
      reject_join_request: { Args: { p_request_id: string }; Returns: boolean }
      sync_match_missing_positions: {
        Args: { p_match_id: string }
        Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
