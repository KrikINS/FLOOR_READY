
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const PendingApproval: React.FC = () => {
    const { user } = useAuth();
    const [isChecking, setIsChecking] = useState(false);
    const [dbStatus, setDbStatus] = useState<string | null>(null);

    const checkStatusRaw = async () => {
        setIsChecking(true);
        try {
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            // Raw fetch to bypass potential library hangs
            const res = await fetch(`${url}/rest/v1/profiles?select=status&id=eq.${user?.id}&limit=1`, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    setDbStatus(data[0].status);
                    if (data[0].status === 'Active') {
                        // Force a reload to clear any stale client state if active
                        alert('Your account is Active! Redirecting...');
                        window.location.href = '/dashboard';
                    }
                }
            }
        } catch (err) {
            console.error('Raw check failed', err);
        } finally {
            setIsChecking(false);
        }
    };

    const forceLogout = () => {
        // Nuke local storage to force sign out
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        Account Pending Approval
                    </h2>
                    <p className="text-slate-600 mb-6">
                        Your account has been created.
                        <br />
                        Current Status: <span className="font-mono font-bold">{dbStatus || 'Checking...'}</span>
                    </p>

                    <div className="flex flex-col space-y-3">
                        <Button
                            onClick={checkStatusRaw}
                            disabled={isChecking}
                        >
                            {isChecking ? 'Checking...' : 'Check Approval Status'}
                        </Button>

                        <div className="pt-4 border-t border-slate-200">
                            <p className="text-xs text-slate-400 mb-2">Stuck?</p>
                            <Button variant="secondary" onClick={forceLogout}>
                                Force Sign Out (Clear Cache)
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
