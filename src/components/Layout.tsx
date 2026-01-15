
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KrikInsLogo from './ui/KrikInsLogo';

// Custom NavLink wrapper
const NavLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    return (
        <Link
            to={to}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } focus:outline-none`}
        >
            {children}
        </Link>
    );
};

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Primary Navigation */}
            <nav className="bg-slate-900 sticky top-0 z-50 border-b border-slate-800 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link to="/dashboard">
                                    <img src="/floor_ready_logo.png" alt="Floor Ready" className="h-10 w-auto" />
                                </Link>
                            </div>
                            {/* Changed breakpoint to md to fit all items */}
                            <div className="hidden md:ml-6 md:flex md:space-x-2 lg:space-x-4">
                                <NavLink to="/dashboard">Dashboard</NavLink>
                                <NavLink to="/events">Events</NavLink>
                                <NavLink to="/tasks">Tasks</NavLink>
                                <NavLink to="/inventory">Inventory</NavLink>
                                <NavLink to="/team">Team</NavLink>
                                <NavLink to="/expense-requests">Expense Requests</NavLink>
                                <NavLink to="/cheques-balances">Cheques & Balances</NavLink>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center relative ml-3">
                                <div className="relative">
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center max-w-xs text-sm font-medium text-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-primary hover:text-white"
                                        id="user-menu-button"
                                        aria-expanded={isUserMenuOpen ? 'true' : 'false'}
                                        aria-haspopup="true"
                                    >
                                        <span className="sr-only">Open user menu</span>
                                        <div className="flex flex-col items-end mr-2">
                                            <span className="font-medium">{user?.user_metadata?.full_name || 'User'}</span>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 overflow-hidden ring-2 ring-slate-800">
                                            {user?.user_metadata?.avatar_url ? (
                                                <img src={user.user_metadata.avatar_url} alt="" className="h-8 w-8 object-cover" />
                                            ) : (
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>

                                    {/* Dropdown menu */}
                                    {isUserMenuOpen && (
                                        <div
                                            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                                            role="menu"
                                            aria-orientation="vertical"
                                            aria-labelledby="user-menu-button"
                                        >
                                            <div className="px-4 py-2 border-b border-gray-100">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user?.user_metadata?.full_name || 'User'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {user?.email}
                                                </p>
                                                {user?.user_metadata?.role === 'Admin' && (
                                                    <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>

                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                Your Profile
                                            </Link>

                                            <button
                                                onClick={() => {
                                                    setIsUserMenuOpen(false);
                                                    handleSignOut();
                                                }}
                                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                role="menuitem"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mobile menu button - visible below md */}
                            <div className="flex items-center md:hidden">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                                    aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
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
                    <div className="md:hidden bg-slate-900 border-t border-slate-800 shadow-lg absolute w-full left-0 z-50">
                        <div className="pt-2 pb-3 space-y-1 px-4">
                            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Dashboard</Link>
                            <Link to="/events" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Events</Link>
                            <Link to="/tasks" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Tasks</Link>
                            <Link to="/inventory" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Inventory</Link>
                            <Link to="/team" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Team</Link>
                            <Link to="/expense-requests" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Expense Requests</Link>
                            <Link to="/cheques-balances" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800">Cheques & Balances</Link>
                        </div>
                        <div className="pt-4 pb-4 border-t border-slate-800 px-4">
                            <div className="flex items-center mb-3 px-3">
                                <div>
                                    <div className="text-base font-medium text-white">{user?.user_metadata?.full_name || 'User'}</div>
                                    <div className="text-sm font-medium text-slate-400">{user?.email}</div>
                                </div>
                                {user?.user_metadata?.role === 'Admin' && (
                                    <span className="ml-auto text-xs bg-red-900/50 text-red-200 px-2 py-0.5 rounded-full font-bold border border-red-800">
                                        Admin
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 px-2">
                                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800">Your Profile</Link>
                                <button
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        handleSignOut();
                                    }}
                                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-400 hover:text-white hover:bg-slate-800"
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
