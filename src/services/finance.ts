import { supabase } from './supabase';
import type { Expense } from '../types';

export const financeService = {
    // Get all expenses
    async getExpenses() {
        const { data, error } = await supabase
            .from('expenses')
            .select(`
                *,
                tasks ( title )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as (Expense & { tasks?: { title: string } })[];
    },

    // Create a new expense
    async createExpense(expense: Partial<Expense>) {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select()
            .single();

        if (error) throw error;
        return data as Expense;
    },

    // Update an expense
    async updateExpense(id: string, updates: Partial<Expense>) {
        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Expense;
    },

    // Get summary stats
    async getStats() {
        // Implementation might need meaningful aggregations via RPC or simple client-side calc
        // For now, simpler to do client-side if data is small, or use count/sum queries
        return null;
    }
};
