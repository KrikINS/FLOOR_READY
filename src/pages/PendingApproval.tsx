
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const PendingApproval: React.FC = () => {
    const { signOut } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">
                        Account Pending Approval
                    </h2>
                    <p className="text-slate-600 mb-6">
                        Your account has been created successfully but is waiting for administrator approval.
                        You will be able to access the dashboard once your account is activated.
                    </p>

                    <div className="flex flex-col space-y-3">
                        <Button onClick={() => window.location.reload()}>
                            I have been approved (Check Again)
                        </Button>
                        <Button variant="ghost" onClick={() => signOut()}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
