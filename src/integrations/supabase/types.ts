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
      collectors: {
        Row: {
          created_at: string
          id: string
          name: string
          operating_location: string | null
          paid_amount: number
          pending_amount: number
          preferred_language: string
          total_earnings: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          operating_location?: string | null
          paid_amount?: number
          pending_amount?: number
          preferred_language?: string
          total_earnings?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          operating_location?: string | null
          paid_amount?: number
          pending_amount?: number
          preferred_language?: string
          total_earnings?: number
        }
        Relationships: []
      }
      lots: {
        Row: {
          approximate_weight: number
          collection_location: string | null
          collector_id: string | null
          condition: string
          created_at: string
          estimated_max_value: number | null
          estimated_min_value: number | null
          id: string
          image_url: string | null
          lot_id: string
          material_category: string
          material_description: string | null
          status: string
        }
        Insert: {
          approximate_weight: number
          collection_location?: string | null
          collector_id?: string | null
          condition?: string
          created_at?: string
          estimated_max_value?: number | null
          estimated_min_value?: number | null
          id?: string
          image_url?: string | null
          lot_id: string
          material_category: string
          material_description?: string | null
          status?: string
        }
        Update: {
          approximate_weight?: number
          collection_location?: string | null
          collector_id?: string | null
          condition?: string
          created_at?: string
          estimated_max_value?: number | null
          estimated_min_value?: number | null
          id?: string
          image_url?: string | null
          lot_id?: string
          material_category?: string
          material_description?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          buying_price_max: number
          buying_price_min: number
          created_at: string
          effective_date: string
          id: string
          location: string
          material_category: string
          unit: string
        }
        Insert: {
          buying_price_max: number
          buying_price_min: number
          created_at?: string
          effective_date?: string
          id?: string
          location?: string
          material_category: string
          unit?: string
        }
        Update: {
          buying_price_max?: number
          buying_price_min?: number
          created_at?: string
          effective_date?: string
          id?: string
          location?: string
          material_category?: string
          unit?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          estimated_total: number
          id: string
          lot_id: string
          quoted_rate: number
          recycler_id: string
          status: string
        }
        Insert: {
          created_at?: string
          estimated_total: number
          id?: string
          lot_id: string
          quoted_rate: number
          recycler_id: string
          status?: string
        }
        Update: {
          created_at?: string
          estimated_total?: number
          id?: string
          lot_id?: string
          quoted_rate?: number
          recycler_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_recycler_id_fkey"
            columns: ["recycler_id"]
            isOneToOne: false
            referencedRelation: "recyclers"
            referencedColumns: ["id"]
          },
        ]
      }
      recyclers: {
        Row: {
          authorization_status: string
          contact_details: string | null
          created_at: string
          id: string
          location: string | null
          materials_accepted: string[]
          name: string
          offered_rate: number
          pickup_available: boolean
          service_area: string | null
        }
        Insert: {
          authorization_status?: string
          contact_details?: string | null
          created_at?: string
          id?: string
          location?: string | null
          materials_accepted?: string[]
          name: string
          offered_rate?: number
          pickup_available?: boolean
          service_area?: string | null
        }
        Update: {
          authorization_status?: string
          contact_details?: string | null
          created_at?: string
          id?: string
          location?: string | null
          materials_accepted?: string[]
          name?: string
          offered_rate?: number
          pickup_available?: boolean
          service_area?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          collector_id: string | null
          created_at: string
          final_price: number
          final_weight: number
          handover_location: string | null
          handover_timestamp: string
          id: string
          lot_id: string
          payment_method: string
          payment_status: string
          recycler_id: string | null
          total_amount: number
        }
        Insert: {
          collector_id?: string | null
          created_at?: string
          final_price: number
          final_weight: number
          handover_location?: string | null
          handover_timestamp?: string
          id?: string
          lot_id: string
          payment_method?: string
          payment_status?: string
          recycler_id?: string | null
          total_amount: number
        }
        Update: {
          collector_id?: string | null
          created_at?: string
          final_price?: number
          final_weight?: number
          handover_location?: string | null
          handover_timestamp?: string
          id?: string
          lot_id?: string
          payment_method?: string
          payment_status?: string
          recycler_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recycler_id_fkey"
            columns: ["recycler_id"]
            isOneToOne: false
            referencedRelation: "recyclers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
