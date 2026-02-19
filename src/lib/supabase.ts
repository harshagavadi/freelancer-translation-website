import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          type: 'client' | 'translator';
          avatar: string | null;
          wallet_balance: number;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          type: 'client' | 'translator';
          avatar?: string | null;
          wallet_balance?: number;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          type?: 'client' | 'translator';
          avatar?: string | null;
          wallet_balance?: number;
          currency?: string;
          created_at?: string;
        };
      };
      freelancer_profiles: {
        Row: {
          id: string;
          user_id: string;
          languages: string[];
          specializations: string[];
          rating: number;
          completed_projects: number;
          active_projects: number;
          max_concurrent_projects: number;
          is_available: boolean;
          price_per_word: number;
          response_time: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          languages?: string[];
          specializations?: string[];
          rating?: number;
          completed_projects?: number;
          active_projects?: number;
          max_concurrent_projects?: number;
          is_available?: boolean;
          price_per_word?: number;
          response_time?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          languages?: string[];
          specializations?: string[];
          rating?: number;
          completed_projects?: number;
          active_projects?: number;
          max_concurrent_projects?: number;
          is_available?: boolean;
          price_per_word?: number;
          response_time?: number;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          title: string;
          source_language: string;
          target_language: string;
          status: 'pending' | 'assigned' | 'in-progress' | 'review' | 'completed' | 'cancelled';
          word_count: number;
          deadline: string;
          price: number;
          client_id: string;
          translator_id: string | null;
          translator_name: string | null;
          description: string;
          auto_assigned: boolean;
          match_score: number | null;
          assigned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source_language: string;
          target_language: string;
          status?: 'pending' | 'assigned' | 'in-progress' | 'review' | 'completed' | 'cancelled';
          word_count: number;
          deadline: string;
          price: number;
          client_id: string;
          translator_id?: string | null;
          translator_name?: string | null;
          description?: string;
          auto_assigned?: boolean;
          match_score?: number | null;
          assigned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          source_language?: string;
          target_language?: string;
          status?: 'pending' | 'assigned' | 'in-progress' | 'review' | 'completed' | 'cancelled';
          word_count?: number;
          deadline?: string;
          price?: number;
          client_id?: string;
          translator_id?: string | null;
          translator_name?: string | null;
          description?: string;
          auto_assigned?: boolean;
          match_score?: number | null;
          assigned_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_files: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          size: number;
          type: string;
          data: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          size: number;
          type: string;
          data: string;
          uploaded_by: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          size?: number;
          type?: string;
          data?: string;
          uploaded_by?: string;
          uploaded_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          project_id: string;
          sender_id: string;
          sender_name: string;
          text: string;
          read: boolean;
          timestamp: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          sender_id: string;
          sender_name: string;
          text: string;
          read?: boolean;
          timestamp?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          sender_id?: string;
          sender_name?: string;
          text?: string;
          read?: boolean;
          timestamp?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'project_assigned' | 'project_completed' | 'message' | 'status_change';
          title: string;
          message: string;
          project_id: string | null;
          read: boolean;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'project_assigned' | 'project_completed' | 'message' | 'status_change';
          title: string;
          message: string;
          project_id?: string | null;
          read?: boolean;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'project_assigned' | 'project_completed' | 'message' | 'status_change';
          title?: string;
          message?: string;
          project_id?: string | null;
          read?: boolean;
          timestamp?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'commission';
          amount: number;
          status: 'pending' | 'completed' | 'failed';
          description: string;
          project_id: string | null;
          payment_method: string | null;
          transaction_fee: number | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          commission_amount: number | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'commission';
          amount: number;
          status?: 'pending' | 'completed' | 'failed';
          description: string;
          project_id?: string | null;
          payment_method?: string | null;
          transaction_fee?: number | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          commission_amount?: number | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'commission';
          amount?: number;
          status?: 'pending' | 'completed' | 'failed';
          description?: string;
          project_id?: string | null;
          payment_method?: string | null;
          transaction_fee?: number | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          commission_amount?: number | null;
          timestamp?: string;
        };
      };
      platform_settings: {
        Row: {
          id: string;
          commission_balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          commission_balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          commission_balance?: number;
          updated_at?: string;
        };
      };
    };
  };
}
