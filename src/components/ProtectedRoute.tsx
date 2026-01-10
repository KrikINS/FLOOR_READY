import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC = () => {
    const { user, profile, loading } = useAuth();

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

    // Critical Logic:
    // 1. If we have a user but NO profile, the DB trigger likely failed.
    //    We treat this as "Pending" or "Error" state.
    if (!profile) {
        // Ideally we might want a specific "Profile Error" page, 
        // but "Pending" page is a safe fallback as it has the "Check Status" button 
        // which will perform the raw check and reveal the issue.
        return <Navigate to="/pending-approval" replace />;
    }

    // 2. Check explicit status
    if (profile.status === 'Pending') {
        return <Navigate to="/pending-approval" replace />;
    }

    if (profile.status === 'Suspended') {
        return <div className="p-8 text-center text-red-600">Your account has been suspended.</div>;
    }

    // 3. If Active (or any other status), allow access
    return <Outlet />;
};

export default ProtectedRoute;
