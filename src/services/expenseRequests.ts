import { supabase } from './supabase';
import type { ExpenseRequest } from '../types';

export const expenseRequestService = {
    // Get requests (RLS handles filtering for users vs admins)
    async getRequests() {
        const { data, error } = await supabase
            .from('expense_requests')
            .select(`
                *,
                profiles:requester_id (full_name, avatar_url),
                tasks:task_id (title)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ExpenseRequest[];
    },

    // Create a new request
    async createRequest(request: Partial<ExpenseRequest>) {
        // Remove joined fields if present to avoid errors
        const { tasks, profiles, ...cleanRequest } = request;

        const { data, error } = await supabase
            .from('expense_requests')
            .insert([cleanRequest])
            .select()
            .single();

        if (error) throw error;
        return data as ExpenseRequest;
    },

    // Update request status (Admin/Manager Approval or User Confirmation)
    async updateStatus(id: string, status: ExpenseRequest['status'], rejectionReason?: string) {
        const updates: any = { status, updated_at: new Date().toISOString() };
        if (rejectionReason !== undefined) {
            updates.rejection_reason = rejectionReason;
        }

        const { data, error } = await supabase
            .from('expense_requests')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ExpenseRequest;
    },

    // Update request details (for corrections)
    async updateRequest(id: string, updates: Partial<ExpenseRequest>) {
        // Remove joined fields if present
        const { tasks, profiles, ...cleanUpdates } = updates;

        const { data, error } = await supabase
            .from('expense_requests')
            .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ExpenseRequest;
    },

    // Get stats for badges (optional)
    async getPendingCount() {
        const { count, error } = await supabase
            .from('expense_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');

        if (error) throw error;
        return count || 0;
    }
};
