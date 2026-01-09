import { supabase } from './supabase';
import type { Event } from '../types';

export const eventsService = {
    async getEvents() {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Event[];
    },

    async getEvent(id: string) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Event;
    },

    async createEvent(event: Omit<Event, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('events')
            .insert(event)
            .select()
            .single();

        if (error) throw error;
        return data as Event;
    },

    async updateEvent(id: string, updates: Partial<Event>) {
        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Event;
    },

    async deleteEvent(id: string) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
