import React from 'react';
import { useAuth } from '../context/AuthContext';
import KrikInsLogo from '../components/ui/KrikInsLogo';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

const PendingApproval: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-xl overflow-hidden border border-slate-700">
                <div className="bg-blue-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approval Pending
                    </h2>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <div className="inline-block p-3 bg-slate-700 rounded-full mb-4">
                            <span className="text-4xl">⏳</span>
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Account Under Review</h3>
                        <p className="text-slate-400">
                            Hello <span className="text-white font-medium">{profile?.full_name || user?.email}</span>,
                        </p>
                        <p className="text-slate-400 mt-2">
                            Your account has been created but requires Administrator approval before you can access the system.
                        </p>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Current Status</h4>
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
                            <span className="text-slate-400 text-sm">Role</span>
                            <span className="text-blue-400 font-medium text-sm">Staff (Pending)</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            className="w-full justify-center"
                            onClick={() => navigate('/team')}
                        >
                            View Team Status
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-center text-slate-400 border border-slate-600 hover:bg-slate-700 hover:text-white"
                            onClick={signOut}
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-slate-500 text-sm">
                Please contact your manager to speed up the approval process.
            </p>

            <KrikInsLogo />
        </div>
    );
};

export default PendingApproval;
