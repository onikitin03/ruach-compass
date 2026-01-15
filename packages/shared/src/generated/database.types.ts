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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_requests: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_states: {
        Row: {
          created_at: string | null
          date: string
          energy: number
          focus: Database["public"]["Enums"]["focus_area"]
          id: string
          notes: string | null
          relationship_intensity: number | null
          ruach_state: Database["public"]["Enums"]["ruach_state"] | null
          sleep_hours: number | null
          stress: number
          user_id: string
          work_intensity: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          energy: number
          focus: Database["public"]["Enums"]["focus_area"]
          id?: string
          notes?: string | null
          relationship_intensity?: number | null
          ruach_state?: Database["public"]["Enums"]["ruach_state"] | null
          sleep_hours?: number | null
          stress: number
          user_id: string
          work_intensity?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          energy?: number
          focus?: Database["public"]["Enums"]["focus_area"]
          id?: string
          notes?: string | null
          relationship_intensity?: number | null
          ruach_state?: Database["public"]["Enums"]["ruach_state"] | null
          sleep_hours?: number | null
          stress?: number
          user_id?: string
          work_intensity?: number | null
        }
        Relationships: []
      }
      quests: {
        Row: {
          category: Database["public"]["Enums"]["quest_category"]
          completed_at: string | null
          created_at: string | null
          daily_state_id: string | null
          date: string
          done: boolean | null
          fail_safe_ru: string
          helped_rating: number | null
          id: string
          outcome_note: string | null
          steps_ru: string[]
          title_ru: string
          type: Database["public"]["Enums"]["quest_type"]
          user_id: string
          why_ru: string
        }
        Insert: {
          category: Database["public"]["Enums"]["quest_category"]
          completed_at?: string | null
          created_at?: string | null
          daily_state_id?: string | null
          date: string
          done?: boolean | null
          fail_safe_ru: string
          helped_rating?: number | null
          id?: string
          outcome_note?: string | null
          steps_ru: string[]
          title_ru: string
          type: Database["public"]["Enums"]["quest_type"]
          user_id: string
          why_ru: string
        }
        Update: {
          category?: Database["public"]["Enums"]["quest_category"]
          completed_at?: string | null
          created_at?: string | null
          daily_state_id?: string | null
          date?: string
          done?: boolean | null
          fail_safe_ru?: string
          helped_rating?: number | null
          id?: string
          outcome_note?: string | null
          steps_ru?: string[]
          title_ru?: string
          type?: Database["public"]["Enums"]["quest_type"]
          user_id?: string
          why_ru?: string
        }
        Relationships: [
          {
            foreignKeyName: "quests_daily_state_id_fkey"
            columns: ["daily_state_id"]
            isOneToOne: false
            referencedRelation: "daily_states"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts_cache: {
        Row: {
          boundary_ru: string
          created_at: string | null
          exit_ru: string
          id: string
          neutral_ru: string
          safety_flags: string[] | null
          scenario_type: Database["public"]["Enums"]["scenario_type"]
          short_ru: string
          tone_notes_ru: string | null
          user_id: string
        }
        Insert: {
          boundary_ru: string
          created_at?: string | null
          exit_ru: string
          id?: string
          neutral_ru: string
          safety_flags?: string[] | null
          scenario_type: Database["public"]["Enums"]["scenario_type"]
          short_ru: string
          tone_notes_ru?: string | null
          user_id: string
        }
        Update: {
          boundary_ru?: string
          created_at?: string | null
          exit_ru?: string
          id?: string
          neutral_ru?: string
          safety_flags?: string[] | null
          scenario_type?: Database["public"]["Enums"]["scenario_type"]
          short_ru?: string
          tone_notes_ru?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          boundaries_style: string | null
          created_at: string | null
          id: string
          language: string | null
          preferred_tone: Database["public"]["Enums"]["tone_preference"] | null
          triggers: Database["public"]["Enums"]["trigger_type"][] | null
          trust_anchor_word: string | null
          updated_at: string | null
          values: string[] | null
        }
        Insert: {
          boundaries_style?: string | null
          created_at?: string | null
          id: string
          language?: string | null
          preferred_tone?: Database["public"]["Enums"]["tone_preference"] | null
          triggers?: Database["public"]["Enums"]["trigger_type"][] | null
          trust_anchor_word?: string | null
          updated_at?: string | null
          values?: string[] | null
        }
        Update: {
          boundaries_style?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          preferred_tone?: Database["public"]["Enums"]["tone_preference"] | null
          triggers?: Database["public"]["Enums"]["trigger_type"][] | null
          trust_anchor_word?: string | null
          updated_at?: string | null
          values?: string[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      focus_area: "work" | "relationship" | "body" | "creation"
      quest_category: "micro" | "medium" | "courage" | "creation" | "body"
      quest_type: "main" | "side"
      ruach_state: "calm" | "tense" | "triggered" | "focused" | "drained"
      scenario_type:
        | "provocation"
        | "accusation"
        | "coldness"
        | "drama"
        | "comparison"
        | "silence"
        | "blame"
        | "testing"
        | "manipulation"
        | "escalation"
      tone_preference: "warm" | "direct" | "philosophical"
      trigger_type:
        | "jealousy"
        | "uncertainty"
        | "anger"
        | "shame"
        | "loneliness"
        | "overwhelm"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      focus_area: ["work", "relationship", "body", "creation"],
      quest_category: ["micro", "medium", "courage", "creation", "body"],
      quest_type: ["main", "side"],
      ruach_state: ["calm", "tense", "triggered", "focused", "drained"],
      scenario_type: [
        "provocation",
        "accusation",
        "coldness",
        "drama",
        "comparison",
        "silence",
        "blame",
        "testing",
        "manipulation",
        "escalation",
      ],
      tone_preference: ["warm", "direct", "philosophical"],
      trigger_type: [
        "jealousy",
        "uncertainty",
        "anger",
        "shame",
        "loneliness",
        "overwhelm",
      ],
    },
  },
} as const
