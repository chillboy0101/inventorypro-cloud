import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    products: [],
    loading: false,
    error: null
  }),

  getters: {
    lowStockProducts: (state) => {
      return state.products.filter(product => product.quantity <= product.min_quantity)
    },
    outOfStockProducts: (state) => {
      return state.products.filter(product => product.quantity === 0)
    }
  },

  actions: {
    async fetchProducts() {
      this.loading = true
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
        
        if (error) throw error
        this.products = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async addProduct(product) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([product])
          .select()
        
        if (error) throw error
        this.products.push(data[0])
        return data[0]
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateProduct(id, updates) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
        
        if (error) throw error
        const index = this.products.findIndex(p => p.id === id)
        if (index !== -1) {
          this.products[index] = data[0]
        }
        return data[0]
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async deleteProduct(id) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        this.products = this.products.filter(p => p.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
}) 