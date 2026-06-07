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
      assignments: {
        Row: {
          created_at: string
          created_by: string
          deadline_date: string
          id: string
          professor_code: string
          target_xp: number
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deadline_date: string
          id?: string
          professor_code: string
          target_xp?: number
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deadline_date?: string
          id?: string
          professor_code?: string
          target_xp?: number
          title?: string
        }
        Relationships: []
      }
      daily_quests: {
        Row: {
          active_date: string
          description: string
          id: string
          reward_gems: number
          target_xp: number
        }
        Insert: {
          active_date?: string
          description: string
          id?: string
          reward_gems?: number
          target_xp?: number
        }
        Update: {
          active_date?: string
          description?: string
          id?: string
          reward_gems?: number
          target_xp?: number
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          game_name: string
          high_score: number
          id: string
          level: number
          times_played: number
          updated_at: string
          user_id: string
        }
        Insert: {
          game_name: string
          high_score?: number
          id?: string
          level?: number
          times_played?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          game_name?: string
          high_score?: number
          id?: string
          level?: number
          times_played?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string
          diagram_url: string | null
          equations: Json
          id: string
          key_points: Json
          module_id: string
          order_index: number
          text_content: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          diagram_url?: string | null
          equations?: Json
          id?: string
          key_points?: Json
          module_id: string
          order_index: number
          text_content?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          diagram_url?: string | null
          equations?: Json
          id?: string
          key_points?: Json
          module_id?: string
          order_index?: number
          text_content?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_module_id: string | null
          display_name: string | null
          email: string | null
          gems: number
          hearts: number
          id: string
          last_active_date: string
          last_heart_at: string
          league: string
          linked_professor_code: string | null
          max_streak: number
          physics_score: number
          placement_completed: boolean
          professor_code: string | null
          school_id: string | null
          streak: number
          updated_at: string
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_module_id?: string | null
          display_name?: string | null
          email?: string | null
          gems?: number
          hearts?: number
          id: string
          last_active_date?: string
          last_heart_at?: string
          league?: string
          linked_professor_code?: string | null
          max_streak?: number
          physics_score?: number
          placement_completed?: boolean
          professor_code?: string | null
          school_id?: string | null
          streak?: number
          updated_at?: string
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_module_id?: string | null
          display_name?: string | null
          email?: string | null
          gems?: number
          hearts?: number
          id?: string
          last_active_date?: string
          last_heart_at?: string
          league?: string
          linked_professor_code?: string | null
          max_streak?: number
          physics_score?: number
          placement_completed?: boolean
          professor_code?: string | null
          school_id?: string | null
          streak?: number
          updated_at?: string
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_type: string
          choices: Json | null
          correct_answer: string
          hint: string | null
          id: string
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          answer_type?: string
          choices?: Json | null
          correct_answer: string
          hint?: string | null
          id?: string
          order_index?: number
          question_text: string
          quiz_id: string
        }
        Update: {
          answer_type?: string
          choices?: Json | null
          correct_answer?: string
          hint?: string | null
          id?: string
          order_index?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          is_checkpoint: boolean
          lesson_id: string | null
          module_id: string | null
          passing_score: number | null
          time_limit_seconds: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_checkpoint?: boolean
          lesson_id?: string | null
          module_id?: string | null
          passing_score?: number | null
          time_limit_seconds?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_checkpoint?: boolean
          lesson_id?: string | null
          module_id?: string | null
          passing_score?: number | null
          time_limit_seconds?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      references_list: {
        Row: {
          citation: string
          created_at: string
          id: string
          order_index: number
          url: string | null
        }
        Insert: {
          citation: string
          created_at?: string
          id?: string
          order_index?: number
          url?: string | null
        }
        Update: {
          citation?: string
          created_at?: string
          id?: string
          order_index?: number
          url?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          gems_spent: number
          id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gems_spent: number
          id?: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          gems_spent?: number
          id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string | null
          module_id: string | null
          posttest_passed: boolean | null
          posttest_score: number | null
          score: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          posttest_passed?: boolean | null
          posttest_score?: number | null
          score?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          posttest_passed?: boolean | null
          posttest_score?: number | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      videos: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          module_id: string | null
          order_index: number
          thumbnail_url: string | null
          title: string
          url: string
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          order_index?: number
          thumbnail_url?: string | null
          title: string
          url: string
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          module_id?: string | null
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grant_admin_role:
        | { Args: { _invite_code: string }; Returns: boolean }
        | {
            Args: {
              _invite_code: string
              _professor_code?: string
              _school_id?: string
            }
            Returns: boolean
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_professor_code: { Args: never; Returns: string }
      professor_code_exists: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "student"
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
      app_role: ["admin", "student"],
    },
  },
} as const
