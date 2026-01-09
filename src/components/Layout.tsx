import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
    const location = useLocation();
    const isActive = (path: string) => location.pathname.startsWith(path);

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
                                <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
                                <NavLink to="/events" active={isActive('/events')}>Events</NavLink>
                                <NavLink to="/tasks" active={isActive('/tasks')}>Tasks</NavLink>
                                <NavLink to="/inventory" active={isActive('/inventory')}>Inventory</NavLink>
                                <NavLink to="/team" active={isActive('/team')}>Team</NavLink>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="ml-3 relative">
                                <Link to="/profile" className="text-sm font-medium text-slate-500 hover:text-slate-700">
                                    Profile
                                </Link>
                            </div>
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

const NavLink: React.FC<{ to: string; active: boolean; children: React.ReactNode }> = ({ to, active, children }) => (
    <Link
        to={to}
        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${active
                ? 'border-primary text-slate-900'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
    >
        {children}
    </Link>
);

export default Layout;
