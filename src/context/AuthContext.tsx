import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Define Profile Interface
export interface Profile {
    id: string;
    email: string;
    full_name?: string;
    role: string;
    status: string;
    phone?: string;
    avatar_url?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper to fetch profile with timeout
    const fetchProfile = async (userId: string) => {
        try {
            // 5 second timeout for profile fetch
            const { data, error } = await Promise.race([
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single(),
                new Promise<{ data: null; error: any }>((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
                )
            ]);

            if (error) throw error;
            return data as Profile;
        } catch (err) {
            console.error('Core: Profile fetch failed', err);
            return null;
        }
    };

    const initializeAuth = async () => {
        try {
            // 1. Get Session
            // Race the session check against a 15s timeout (increased for slow connections)
            const { data: { session: currentSession } } = await Promise.race([
                supabase.auth.getSession(),
                new Promise<{ data: { session: null } }>((resolve) =>
                    setTimeout(() => resolve({ data: { session: null } }), 15000)
                )
            ]);

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
                // 2. Fetch Profile if user exists
                const userProfile = await fetchProfile(currentSession.user.id);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error('Core: Auth initialization error', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`Core: Auth Event ${event}`);

            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
            } else if (newSession?.user) {
                setSession(newSession);
                setUser(newSession.user);

                // Only fetch profile if we don't have it or if it's a new user
                if (!profile || profile.id !== newSession.user.id) {
                    const userProfile = await fetchProfile(newSession.user.id);
                    setProfile(userProfile);
                }
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Robust SignOut: Clears local state FIRST, then tries network
    const signOut = async () => {
        // 1. Instant UI update
        setSession(null);
        setUser(null);
        setProfile(null);

        // 2. Nuke storage (failsafe)
        localStorage.clear();
        sessionStorage.clear();

        // 3. Try network signout (fire and forget)
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn('Core: Network signout failed (ignoring)', err);
        }

        // 4. Force reload to ensure clean slate
        window.location.href = '/login';
    };

    const refreshProfile = async () => {
        if (user) {
            const userProfile = await fetchProfile(user.id);
            if (userProfile) setProfile(userProfile);
        }
    };

    const value = {
        session,
        user,
        profile,
        loading,
        signOut,
        refreshProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
