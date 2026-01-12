import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import SplashScreen from '../components/ui/SplashScreen';
import KrikInsLogo from '../components/ui/KrikInsLogo';

export default function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [splashMode, setSplashMode] = useState<'loading' | 'login'>('loading');

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSplashMode('login');
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'Staff', // Default role
                        status: 'Pending' // Explicit pending status
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                alert('Registration successful! Please wait for Admin approval.');
                navigate('/login');
            }
        } catch (err: any) {
            // Handle database querying schema error gracefully if it still happens (it shouldn't)
            if (err.message?.includes('querying schema')) {
                setError("System Error: Please restart the project in Supabase Dashboard (Settings -> Restart Project) to apply recent fixes.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SplashScreen mode={splashMode}>
            <div className="w-full max-w-md space-y-8 animate-fade-in px-4">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Create an account</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Or <Link to="/login" className="font-medium text-blue-500 hover:text-blue-400">sign in to your existing account</Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="full-name" className="block text-sm font-medium text-slate-300">
                                Full Name
                            </label>
                            <input
                                id="full-name"
                                name="full-name"
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800/50 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="block text-sm font-medium text-slate-300">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800/50 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800/50 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? 'Creating account...' : 'Sign up'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-xs text-slate-500">Contact Admin for access issues</p>
                </div>
                <KrikInsLogo className="fixed bottom-4 right-4 opacity-50 text-xs sm:text-sm" />
            </div>
        </SplashScreen>
    );
}
