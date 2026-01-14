
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
                                <NavLink to="/cheques-balances">Cheques & Balances</NavLink>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-end hidden sm:flex">
                                <Link to="/profile" className="text-sm font-medium text-slate-900 hover:text-primary">
                                    {user?.user_metadata?.full_name || 'Profile'}
                                </Link>
                                {user?.user_metadata?.role === 'Admin' && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                    Sign Out
                                </Button>
                            </div>

                            {/* Mobile menu button */}
                            <div className="flex items-center sm:hidden">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                    aria-expanded="false"
                                >
                                    <span className="sr-only">Open main menu</span>
                                    {/* Icon when menu is closed. */}
                                    {/* Heroicon name: outline/menu */}
                                    {!isMobileMenuOpen ? (
                                        <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    ) : (
                                        /* Icon when menu is open. */
                                        /* Heroicon name: outline/x */
                                        <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile menu, show/hide based on menu state. */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden bg-white border-t border-gray-200 shadow-lg absolute w-full left-0 z-50">
                        <div className="pt-2 pb-3 space-y-1 px-4">
                            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Dashboard</Link>
                            <Link to="/events" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Events</Link>
                            <Link to="/tasks" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Tasks</Link>
                            <Link to="/inventory" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Inventory</Link>
                            <Link to="/team" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Team</Link>
                            <Link to="/cheques-balances" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Cheques & Balances</Link>
                        </div>
                        <div className="pt-4 pb-4 border-t border-gray-200 px-4">
                            <div className="flex items-center mb-3 px-3">
                                <div>
                                    <div className="text-base font-medium text-gray-800">{user?.user_metadata?.full_name || 'User'}</div>
                                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                </div>
                                {user?.user_metadata?.role === 'Admin' && (
                                    <span className="ml-auto text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 px-2">
                                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">Your Profile</Link>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleSignOut();
                                    }}
                                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
