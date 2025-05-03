// Database entity types
export interface Organization {
  id: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  contact_email: string;
  contact_phone: string;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  organization_id?: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  is_toll_plaza?: boolean;
  is_warehouse?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  organization_id?: string;
  registration_number: string;
  type: 'LORRY' | 'TRUCK' | 'TEN_WHEELER' | 'FOURTEEN_WHEELER' | 'OTHER';
  max_weight: number;
  capacity_volume?: number;
  fuel_type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Route {
  id: string;
  organization_id?: string;
  user_id?: string;
  origin_id: string;
  destination_id: string;
  vehicle_id?: string;
  cargo_weight?: number;
  cargo_type?: string;
  distance_km?: number;
  estimated_time_mins?: number;
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  
  // Computed fields
  full_name?: string; // For compatibility with older code
  phone_number?: string; // For compatibility with older code
}

// Travel history as per the database schema
export interface TravelHistoryItem {
  id: string;
  organization_id: string;
  user_id: string;
  route_id: string;
  vehicle_id: string;
  
  // Planned vs actual metrics
  planned_start_time?: string;
  planned_end_time?: string;
  actual_start_time: string;
  actual_end_time?: string;
  
  // Distance metrics
  planned_distance?: number;
  actual_distance?: number;
  
  // Cost metrics
  planned_fuel_cost?: number;
  actual_fuel_cost?: number;
  planned_toll_cost?: number;
  actual_toll_cost?: number;
  fuel_consumed?: number;
  
  // Location references
  origin_id: string;
  destination_id: string;
  
  // Performance metrics
  average_speed?: number;
  max_speed?: number;
  
  // Status and metadata
  status: string; // 'COMPLETED', 'CANCELLED', 'DELAYED'
  delay_minutes?: number;
  delay_reason?: string;
  notes?: string;
  
  // User feedback
  rating?: number;
  feedback?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Enriched travel history with related entities
export interface EnrichedTravelHistoryItem extends TravelHistoryItem {
  // Related entities
  routes?: Route;
  user_profiles?: UserProfile;
  vehicle?: Vehicle;
  origin_location?: Location;
  destination_location?: Location;
}

// Type for chart data displayed in history page
export interface ChartDataItem {
  month: string;
  distance: number;
  fuelCost: number;
  tollCost: number;
  count: number;
} 