import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types';

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

    // Helper to fetch profile with timeout and fallbacks
    const fetchProfile = async (userId: string) => {
        try {
            // Attempt 1: Standard Client with Timeout
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

            if (!error && data) return data as Profile;
            if (error) console.warn('Core: Client fetch failed, trying fallback...', error);

        } catch (err) {
            console.warn('Core: Client fetch timed out/failed, switching to REST fallback...', err);
        }

        // Attempt 2: Direct REST Fetch (Bypasses Client State)
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // We need the current session token for RLS
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token || !supabaseUrl || !supabaseKey) throw new Error('Missing config for fallback');

            const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`REST Error: ${response.statusText}`);

            const rows = await response.json();
            if (rows && rows.length > 0) return rows[0] as Profile;

            console.error('Core: No profile found via fallback');
            return null;

        } catch (fallbackErr) {
            console.error('Core: All profile fetch attempts failed', fallbackErr);
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
                // OPTIMIZATION: Only update state if the token effectively changed to prevent re-renders on focus
                setSession(prev => {
                    if (prev?.access_token === newSession.access_token) {
                        return prev; // No change
                    }
                    return newSession;
                });

                setUser(prev => {
                    if (prev?.id === newSession.user.id && prev?.updated_at === newSession.user.updated_at) {
                        return prev;
                    }
                    return newSession.user;
                });

                // Only fetch profile if we don't have it or if it's a new user
                // Fire and forget profile fetch to avoid blocking the auth listener
                // We rely on state updates to trigger re-renders
                fetchProfile(newSession.user.id).then(userProfile => {
                    if (userProfile) setProfile(userProfile);
                    setLoading(false);
                });
            } else {
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
