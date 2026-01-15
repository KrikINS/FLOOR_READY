import { supabase } from './supabase';
import type { CostCenter } from '../types';

export const costCenterService = {
    async getCostCenters() {
        const { data, error } = await supabase
            .from('cost_centers')
            .select('*')
            .order('code', { ascending: true });

        if (error) throw error;
        return data as CostCenter[];
    },

    async createCostCenter(costCenter: Omit<CostCenter, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('cost_centers')
            .insert([costCenter])
            .select()
            .single();

        if (error) throw error;
        return data as CostCenter;
    },

    async updateCostCenter(id: string, updates: Partial<CostCenter>) {
        const { data, error } = await supabase
            .from('cost_centers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CostCenter;
    },

    async deleteCostCenter(id: string) {
        const { error } = await supabase
            .from('cost_centers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
