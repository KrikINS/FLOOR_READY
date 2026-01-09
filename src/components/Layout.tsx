
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

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
    const { signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Primary Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
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
                            <Link to="/profile" className="text-sm font-medium text-slate-500 hover:text-slate-700">
                                Profile
                            </Link>
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
        </div>
    );
};

export default Layout;
