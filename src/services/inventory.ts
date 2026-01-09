import { supabase } from './supabase';
import type { InventoryItem } from '../types';

export const inventoryService = {
    async getInventory() {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('item_name');

        if (error) throw error;
        return data as InventoryItem[];
    },

    async getItem(id: string) {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as InventoryItem;
    },

    async addItem(item: Omit<InventoryItem, 'id'>) {
        const { data, error } = await supabase
            .from('inventory')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data as InventoryItem;
    },

    async updateStock(id: string, newStock: number) {
        const { data, error } = await supabase
            .from('inventory')
            .update({ current_stock: newStock })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as InventoryItem;
    },

    async deleteItem(id: string) {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
