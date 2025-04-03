import { supabase } from '../supabase';
import type { Database } from '../../types/supabase';

export class BaseApi<T extends keyof Database['public']['Tables'] = any> {
  protected supabase = supabase;
  protected table: T;

  constructor(table?: T) {
    this.table = table as T;
  }

  async getAll() {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching ${this.table}:`, error);
      throw new Error(`Failed to fetch ${this.table}`);
    }

    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching ${this.table} by ID:`, error);
      throw new Error(`Failed to fetch ${this.table} by ID`);
    }

    return data;
  }

  async create<I extends Database['public']['Tables'][T]['Insert']>(item: I) {
    const { data, error } = await this.supabase
      .from(this.table)
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${this.table}:`, error);
      throw new Error(`Failed to create ${this.table}`);
    }

    return data;
  }

  async update<U extends Database['public']['Tables'][T]['Update']>(id: string, updates: U) {
    const { data, error } = await this.supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating ${this.table}:`, error);
      throw new Error(`Failed to update ${this.table}`);
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting ${this.table}:`, error);
      throw new Error(`Failed to delete ${this.table}`);
    }
  }

  async getWithRelations(relations: string[]) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select(`*, ${relations.join(', ')}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}