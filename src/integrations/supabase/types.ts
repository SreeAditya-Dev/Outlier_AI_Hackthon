export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fuel_prices: {
        Row: {
          city: string | null
          created_at: string | null
          diesel_price: number
          effective_date: string
          id: string
          petrol_price: number
          state: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          diesel_price: number
          effective_date: string
          id?: string
          petrol_price: number
          state: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          diesel_price?: number
          effective_date?: string
          id?: string
          petrol_price?: number
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          is_toll_plaza: boolean | null
          latitude: number
          longitude: number
          name: string
          postal_code: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_toll_plaza?: boolean | null
          latitude: number
          longitude: number
          name: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          is_toll_plaza?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      road_segments: {
        Row: {
          created_at: string | null
          distance: number
          end_location_id: string | null
          has_restrictions: boolean | null
          height_limit: number | null
          id: string
          name: string | null
          restriction_details: Json | null
          road_quality: string | null
          road_type: string | null
          speed_limit: number | null
          start_location_id: string | null
          updated_at: string | null
          weight_limit: number | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          distance: number
          end_location_id?: string | null
          has_restrictions?: boolean | null
          height_limit?: number | null
          id?: string
          name?: string | null
          restriction_details?: Json | null
          road_quality?: string | null
          road_type?: string | null
          speed_limit?: number | null
          start_location_id?: string | null
          updated_at?: string | null
          weight_limit?: number | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          distance?: number
          end_location_id?: string | null
          has_restrictions?: boolean | null
          height_limit?: number | null
          id?: string
          name?: string | null
          restriction_details?: Json | null
          road_quality?: string | null
          road_type?: string | null
          speed_limit?: number | null
          start_location_id?: string | null
          updated_at?: string | null
          weight_limit?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "road_segments_end_location_id_fkey"
            columns: ["end_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "road_segments_start_location_id_fkey"
            columns: ["start_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      route_segments: {
        Row: {
          created_at: string | null
          distance: number | null
          estimated_time: number | null
          id: string
          road_segment_id: string | null
          route_id: string | null
          sequence_number: number | null
          toll_cost: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          distance?: number | null
          estimated_time?: number | null
          id?: string
          road_segment_id?: string | null
          route_id?: string | null
          sequence_number?: number | null
          toll_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          distance?: number | null
          estimated_time?: number | null
          id?: string
          road_segment_id?: string | null
          route_id?: string | null
          sequence_number?: number | null
          toll_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "route_segments_road_segment_id_fkey"
            columns: ["road_segment_id"]
            isOneToOne: false
            referencedRelation: "road_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_segments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          cargo_type: string | null
          cargo_weight: number | null
          created_at: string | null
          destination_id: string | null
          estimated_fuel_cost: number | null
          estimated_time: number | null
          id: string
          origin_id: string | null
          route_geometry: Json | null
          total_distance: number | null
          total_toll_cost: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
          waypoints: Json | null
        }
        Insert: {
          cargo_type?: string | null
          cargo_weight?: number | null
          created_at?: string | null
          destination_id?: string | null
          estimated_fuel_cost?: number | null
          estimated_time?: number | null
          id?: string
          origin_id?: string | null
          route_geometry?: Json | null
          total_distance?: number | null
          total_toll_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
          waypoints?: Json | null
        }
        Update: {
          cargo_type?: string | null
          cargo_weight?: number | null
          created_at?: string | null
          destination_id?: string | null
          estimated_fuel_cost?: number | null
          estimated_time?: number | null
          id?: string
          origin_id?: string | null
          route_geometry?: Json | null
          total_distance?: number | null
          total_toll_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_id?: string | null
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      toll_plazas: {
        Row: {
          created_at: string | null
          highway_name: string | null
          id: string
          is_fastag_enabled: boolean | null
          location_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          highway_name?: string | null
          id?: string
          is_fastag_enabled?: boolean | null
          location_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          highway_name?: string | null
          id?: string
          is_fastag_enabled?: boolean | null
          location_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "toll_plazas_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      toll_rates: {
        Row: {
          created_at: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          rate: number
          toll_plaza_id: string | null
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          rate: number
          toll_plaza_id?: string | null
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          rate?: number
          toll_plaza_id?: string | null
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "toll_rates_toll_plaza_id_fkey"
            columns: ["toll_plaza_id"]
            isOneToOne: false
            referencedRelation: "toll_plazas"
            referencedColumns: ["id"]
          },
        ]
      }
      traffic_conditions: {
        Row: {
          congestion_level: string | null
          created_at: string | null
          delay_minutes: number | null
          id: string
          recorded_at: string | null
          road_segment_id: string | null
          speed_factor: number | null
          updated_at: string | null
        }
        Insert: {
          congestion_level?: string | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          recorded_at?: string | null
          road_segment_id?: string | null
          speed_factor?: number | null
          updated_at?: string | null
        }
        Update: {
          congestion_level?: string | null
          created_at?: string | null
          delay_minutes?: number | null
          id?: string
          recorded_at?: string | null
          road_segment_id?: string | null
          speed_factor?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_conditions_road_segment_id_fkey"
            columns: ["road_segment_id"]
            isOneToOne: false
            referencedRelation: "road_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_history: {
        Row: {
          actual_distance: number | null
          actual_end_time: string | null
          actual_fuel_cost: number | null
          actual_start_time: string | null
          actual_toll_cost: number | null
          created_at: string | null
          id: string
          notes: string | null
          rating: number | null
          route_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_distance?: number | null
          actual_end_time?: string | null
          actual_fuel_cost?: number | null
          actual_start_time?: string | null
          actual_toll_cost?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          route_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_distance?: number | null
          actual_end_time?: string | null
          actual_fuel_cost?: number | null
          actual_start_time?: string | null
          actual_toll_cost?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rating?: number | null
          route_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travel_history_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travel_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          axle_count: number | null
          created_at: string | null
          fuel_efficiency: number | null
          height: number | null
          id: string
          length: number | null
          max_volume: number | null
          max_weight: number
          name: string
          type: string
          updated_at: string | null
          width: number | null
        }
        Insert: {
          axle_count?: number | null
          created_at?: string | null
          fuel_efficiency?: number | null
          height?: number | null
          id?: string
          length?: number | null
          max_volume?: number | null
          max_weight: number
          name: string
          type: string
          updated_at?: string | null
          width?: number | null
        }
        Update: {
          axle_count?: number | null
          created_at?: string | null
          fuel_efficiency?: number | null
          height?: number | null
          id?: string
          length?: number | null
          max_volume?: number | null
          max_weight?: number
          name?: string
          type?: string
          updated_at?: string | null
          width?: number | null
        }
        Relationships: []
      }
      weather_conditions: {
        Row: {
          condition: string | null
          created_at: string | null
          id: string
          location_id: string | null
          precipitation: number | null
          recorded_at: string | null
          temperature: number | null
          updated_at: string | null
          visibility: number | null
          wind_speed: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          precipitation?: number | null
          recorded_at?: string | null
          temperature?: number | null
          updated_at?: string | null
          visibility?: number | null
          wind_speed?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          precipitation?: number | null
          recorded_at?: string | null
          temperature?: number | null
          updated_at?: string | null
          visibility?: number | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_conditions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
