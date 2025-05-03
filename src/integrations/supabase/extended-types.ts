import { Database } from './types';

// Define the organizations table structure that's missing from the auto-generated types
declare module './types' {
  interface Database {
    public: {
      Tables: {
        organizations: {
          Row: {
            id: string;
            name: string;
            address: string;
            city: string;
            state: string;
            contact_email: string;
            contact_phone: string;
            created_at?: string;
            updated_at?: string;
          };
          Insert: {
            id?: string;
            name: string;
            address: string;
            city: string;
            state: string;
            contact_email: string;
            contact_phone: string;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            name?: string;
            address?: string;
            city?: string;
            state?: string;
            contact_email?: string;
            contact_phone?: string;
            updated_at?: string;
          };
          Relationships: [];
        };
      };
    };
  }
}

// Also add missing fields to user_profiles
declare module './types' {
  interface Database {
    public: {
      Tables: {
        user_profiles: {
          Row: {
            organization_id?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
          };
          Insert: {
            organization_id?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
          };
          Update: {
            organization_id?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
          };
        };
      };
    };
  }
}

// Create a typed version of the supabase client that includes our extended types
export type ExtendedDatabase = Database; 