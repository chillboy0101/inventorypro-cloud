import { supabase } from '../supabase';
export class BaseApi {
    constructor(table) {
        Object.defineProperty(this, "supabase", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: supabase
        });
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.table = table;
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
    async getById(id) {
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
    async create(item) {
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
    async update(id, updates) {
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
    async delete(id) {
        const { error } = await this.supabase
            .from(this.table)
            .delete()
            .eq('id', id);
        if (error) {
            console.error(`Error deleting ${this.table}:`, error);
            throw new Error(`Failed to delete ${this.table}`);
        }
    }
    async getWithRelations(relations) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select(`*, ${relations.join(', ')}`)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
}
