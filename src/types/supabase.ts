export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sku: string;
          category: string;
          stock: number;
          cost_price?: number;
          selling_price?: number;
          location: string;
          reorder_level: number;
          custom_icon?: string;
          custom_icon_type?: 'default' | 'custom';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sku: string;
          category: string;
          stock?: number;
          cost_price?: number;
          selling_price?: number;
          location: string;
          reorder_level?: number;
          custom_icon?: string;
          custom_icon_type?: 'default' | 'custom';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sku?: string;
          category?: string;
          stock?: number;
          cost_price?: number;
          selling_price?: number;
          location?: string;
          reorder_level?: number;
          custom_icon?: string;
          custom_icon_type?: 'default' | 'custom';
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer: string;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_items: number;
          total_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer: string;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_items?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer?: string;
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          total_items?: number;
          total_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          price?: number;
          created_at?: string;
        };
      };
      stock_adjustments: {
        Row: {
          id: string;
          product_id: string;
          quantity: number;
          adjustment_type: 'in' | 'out';
          reason: string;
          previous_quantity: number;
          new_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity: number;
          adjustment_type: 'in' | 'out';
          reason: string;
          previous_quantity: number;
          new_quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity?: number;
          adjustment_type?: 'in' | 'out';
          reason?: string;
          previous_quantity?: number;
          new_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 