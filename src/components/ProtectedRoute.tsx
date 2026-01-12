import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Status Gate: Redirect Pending users
    if (profile?.status === 'Pending') {
        const allowedPaths = ['/pending-approval', '/team'];
        if (!allowedPaths.includes(location.pathname)) {
            return <Navigate to="/pending-approval" replace />;
        }
    }

    // If Active user tries to go to pending page, send to dashboard
    if (profile?.status === 'Active' && location.pathname === '/pending-approval') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
