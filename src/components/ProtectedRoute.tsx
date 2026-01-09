import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
    const { user, loading } = useAuth();

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

    // Check status
    const status = user.user_metadata?.status;
    // Allow if Active OR if no status (legacy/admin edge case) but safest to enforce.
    // However, newly registered users WILL have status 'Pending'.
    // Existing users just got updated to 'Active'.
    if (status === 'Pending') {
        return <Navigate to="/pending-approval" replace />;
    }
    if (status === 'Suspended') {
        return <div className="p-8 text-center text-red-600">Your account has been suspended.</div>;
    }

    return <Outlet />;
};

export default ProtectedRoute;
