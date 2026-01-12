import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import SplashScreen from '../components/ui/SplashScreen';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [splashMode, setSplashMode] = useState<'loading' | 'login'>('loading');

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSplashMode('login');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;
            navigate('/dashboard');
        } catch (err: unknown) {
            console.error('Login error:', err);
            setError((err as Error).message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SplashScreen mode={splashMode}>
            <div className="w-full">
                <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        Sign in to your account
                    </h2>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded relative">
                            {error}
                        </div>
                    )}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none block w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-md shadow-sm placeholder-slate-400 text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-transparent text-slate-400">
                                    Or <Link to="/register" className="font-medium text-blue-500 hover:text-blue-400">create a new account</Link>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SplashScreen>
    );
};

export default Login;
