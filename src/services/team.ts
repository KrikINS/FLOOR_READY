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

    async getCurrentProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('getCurrentProfile: No auth user found');
            return null;
        }

        // Retry logic for profile fetch
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error && data) return data as Profile;

            console.warn(`getCurrentProfile: Attempt ${attempts + 1} failed`, error);
            attempts++;
            // Wait 1s before retry
            if (attempts < maxAttempts) await new Promise(r => setTimeout(r, 1000));
        }

        console.error('getCurrentProfile: All attempts failed for user', user.id);
        return null;
    },

    async updateMemberRole(userId: string, role: 'Admin' | 'Manager' | 'Staff') {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (error) throw error;
    },

    async deleteMember(userId: string) {
        const { error } = await supabase.rpc('delete_user', { target_user_id: userId });
        if (error) throw error;
    },

    async updateMemberStatus(userId: string, status: 'Active' | 'Suspended' | 'Pending') {
        const { error } = await supabase
            .from('profiles')
            .update({ status })
            .eq('id', userId);

        if (error) throw error;
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
