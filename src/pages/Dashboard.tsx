import React from 'react';

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Stats Cards */}
                {['Active Tasks', 'Completed Tasks', 'Pending Inventory'].map((stat) => (
                    <div key={stat} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-slate-500 truncate">
                                {stat}
                            </dt>
                            <dd className="mt-1 text-3xl font-semibold text-slate-900">
                                0
                            </dd>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-slate-900 mb-4">Recent Activity</h2>
                <p className="text-slate-500">No recent activity.</p>
            </div>
        </div>
    );
};

export default Dashboard;
