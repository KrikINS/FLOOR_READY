import { supabase } from './supabase';
import type { Task } from '../types';

export const tasksService = {
    async getTasks() {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        profiles:assignee_id (full_name, avatar_url),
        events:event_id (name)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Task[];
    },

    async getTasksByEvent(eventId: string) {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        profiles:assignee_id (full_name, avatar_url)
      `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Task[];
    },

    async getTask(id: string) {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        profiles:assignee_id (full_name, avatar_url),
        events:event_id (name)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Task;
    },

    async createTask(task: Omit<Task, 'id' | 'created_at' | 'profiles' | 'events'>) {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select()
            .single();

        if (error) throw error;
        return data as Task;
    },

    async createTaskWithInventory(
        task: Omit<Task, 'id' | 'created_at' | 'profiles' | 'events'>,
        inventoryIds: string[]
    ) {
        // 1. Create Task
        console.log('Creating task payload:', task);
        const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .insert(task)
            .select()
            .single();

        if (taskError) {
            console.error('Supabase Create Task Error:', taskError);
            throw taskError;
        }

        // 2. Link Inventory
        if (inventoryIds.length > 0) {
            const inventoryLinks = inventoryIds.map(invId => ({
                task_id: taskData.id,
                inventory_id: invId,
                quantity_required: 1 // Default quantity
            }));

            const { error: invError } = await supabase
                .from('task_inventory')
                .insert(inventoryLinks);

            if (invError) {
                console.error('Failed to link inventory:', invError);
                throw invError;
            }
        }

        return taskData as Task;
    },

    async updateTask(id: string, updates: Partial<Task>) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Task;
    },

    async deleteTask(id: string) {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
