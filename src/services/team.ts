import { supabase } from './supabase';
import type { Profile } from '../types';

export const teamService = {
    async getTeamMembers() {
        // Fetch all profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name');

        if (error) throw error;
        return data as Profile[];
    },

    async updateMemberRole(userId: string, role: 'Admin' | 'Manager' | 'Employee') {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    async inviteMember(email: string) {
        // This is a placeholder for actual invitation logic
        // In a real app, you might use Supabase Edge Functions or an API route to send an email
        // For now, we'll just simulate a successful invitation

        // Check if user already exists
        const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email) // Assuming email is in profiles, but standard profiles often don't expose email directly for security unless configured. 
            // Actually, profiles usually links to auth.users. 
            // For this MVP, we might simple pretend to invite.
            .single();

        if (data) {
            throw new Error('User already exists');
        }

        // Simulating API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return { success: true, message: `Invitation sent to ${email}` };
    }
};
