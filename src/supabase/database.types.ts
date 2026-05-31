export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string | null;
          national_id: string | null;
          member_no: string | null;
          role: Database['public']['Enums']['user_role'];
          status: Database['public']['Enums']['user_status'];
          profile_image_url: string | null;
          kvkk_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          email?: string | null;
          national_id?: string | null;
          member_no?: string | null;
          role?: Database['public']['Enums']['user_role'];
          status?: Database['public']['Enums']['user_status'];
          profile_image_url?: string | null;
          kvkk_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      announcements: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      appointments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      finance_records: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      news: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      notifications: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      ohs_contents: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      payments: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      vehicles: {
        Row: {
          id: string;
          plate_number: string;
          brand: string | null;
          model: string | null;
          year: number | null;
          owner_id: string;
          active_driver_id: string | null;
          status: Database['public']['Enums']['vehicle_status'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plate_number: string;
          brand?: string | null;
          model?: string | null;
          year?: number | null;
          owner_id: string;
          active_driver_id?: string | null;
          status?: Database['public']['Enums']['vehicle_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
        Relationships: [];
      };
      driver_plate_requests: {
        Row: {
          id: string;
          driver_id: string;
          owner_id: string;
          vehicle_id: string;
          plate_number: string;
          status: Database['public']['Enums']['plate_request_status'];
          initiated_by: Database['public']['Enums']['plate_request_initiator'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          driver_id: string;
          owner_id: string;
          vehicle_id: string;
          plate_number: string;
          status?: Database['public']['Enums']['plate_request_status'];
          initiated_by?: Database['public']['Enums']['plate_request_initiator'];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['driver_plate_requests']['Insert']>;
        Relationships: [];
      };
      forgotten_items: {
        Row: {
          id: string;
          reporter_id: string;
          vehicle_id: string | null;
          plate_number: string;
          description: string;
          photo_path: string;
          status: Database['public']['Enums']['forgotten_item_status'];
          admin_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          vehicle_id?: string | null;
          plate_number: string;
          description?: string;
          photo_path: string;
          status?: Database['public']['Enums']['forgotten_item_status'];
          admin_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['forgotten_items']['Insert']>;
        Relationships: [];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['push_tokens']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: { is_admin: { Args: never; Returns: boolean } };
    Enums: {
      user_role: 'USER' | 'DRIVER' | 'PLATE_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
      user_status: 'ACTIVE' | 'PASSIVE' | 'PENDING_VERIFICATION';
      vehicle_status: 'ACTIVE' | 'PASSIVE';
      plate_request_status: 'PENDING' | 'APPROVED' | 'REJECTED';
      plate_request_initiator: 'DRIVER' | 'OWNER';
      forgotten_item_status: 'PENDING' | 'REVIEWING' | 'RETURNED' | 'CLOSED';
      finance_type: 'INCOME' | 'EXPENSE';
      announcement_priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      payment_type: 'DUES' | 'APP_FEE' | 'SERVICE_FEE' | 'OTHER';
      payment_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
      appointment_type: 'HOTEL' | 'AUTO_SERVICE';
      appointment_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
      ohs_content_type: 'VIDEO' | 'ARTICLE' | 'GUIDE' | 'FAQ';
      notification_type: 'ANNOUNCEMENT' | 'NEWS' | 'PAYMENT' | 'APPOINTMENT' | 'SYSTEM';
    };
    CompositeTypes: Record<string, never>;
  };
};
