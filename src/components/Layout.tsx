
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import KrikInsLogo from './ui/KrikInsLogo';

// Custom NavLink wrapper
const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    return (
        <Link
            to={to}
            className={`inline - flex items - center px - 1 pt - 1 border - b - 2 text - sm font - medium ${isActive
                ? 'border-primary text-slate-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                } `}
        >
            {children}
        </Link>
    );
};

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Primary Navigation */}
            <nav className="glass-panel sticky top-0 z-50 border-b-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/dashboard" className="text-xl font-bold text-primary">
                                    Floor Ready
                                </Link>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <NavLink to="/dashboard">Dashboard</NavLink>
                                <NavLink to="/events">Events</NavLink>
                                <NavLink to="/tasks">Tasks</NavLink>
                                <NavLink to="/inventory">Inventory</NavLink>
                                <NavLink to="/team">Team</NavLink>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end">
                                <Link to="/profile" className="text-sm font-medium text-slate-900 hover:text-primary">
                                    {user?.user_metadata?.full_name || 'Profile'}
                                </Link>
                                {user?.user_metadata?.role === 'Admin' && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Outlet />
                </div>
            </main>

            <KrikInsLogo />
        </div>
    );
};

export default Layout;
