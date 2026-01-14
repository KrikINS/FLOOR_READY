import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboard';
import type { DashboardStats, RecentActivity } from '../services/dashboard';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        activeTasks: 0,
        pendingExpenses: 0,
        totalTeam: 0,
        taskMetrics: { total: 0, completed: 0, active: 0, delayed: 0, onTimePercentage: 100 }
    });
    const [activity, setActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsData, activityData] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getRecentActivity()
                ]);
                setStats(statsData);
                setActivity(activityData);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const statCards = [
        { name: 'Active Tasks', value: stats.activeTasks, color: 'bg-blue-500' },
        { name: 'Pending Expense Requests', value: stats.pendingExpenses, color: 'bg-orange-500' },
        { name: 'Team Members', value: stats.totalTeam, color: 'bg-indigo-500' },
    ];

    const quickActions = [
        {
            name: 'New Task', path: '/tasks', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
        {
            name: 'New Expense', path: '/expense-requests', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0-2.08-.402-2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            name: 'New Event', path: '/events/new', icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
    ];

    if (loading) {
        return <div className="p-4 text-center text-slate-500">Loading dashboard...</div>;
    }

    // Helper to calculate bar width
    const getPercent = (value: number) => {
        if (stats.taskMetrics.total === 0) return 0;
        return Math.round((value / stats.taskMetrics.total) * 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}!</h1>
                    <p className="text-sm text-slate-500 mt-1">Here's what's happening today.</p>
                </div>
                <div className="text-sm text-slate-400">
                    {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                    <button
                        key={action.name}
                        onClick={() => navigate(action.path)}
                        className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow hover:border-slate-200 group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-50 rounded-lg text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                {action.icon}
                            </div>
                            <span className="font-medium text-slate-700 group-hover:text-slate-900">{action.name}</span>
                        </div>
                        <svg className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                ))}
            </div>

            {/* Stats Cards - Forced Single Row on large screens using grid trends */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {statCards.map((stat) => (
                    <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-100">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color} bg-opacity-10`}>
                                    <div className={`w-4 h-4 rounded-full ${stat.color}`}></div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-slate-500 truncate">
                                            {stat.name}
                                        </dt>
                                        <dd>
                                            <div className="text-lg font-semibold text-slate-900">
                                                {stat.value}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Task Performance & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Task Performance Chart */}
                <div className="bg-white shadow-sm rounded-xl border border-slate-100 p-6">
                    <h2 className="text-lg font-medium text-slate-900 mb-6">Task Performance</h2>

                    <div className="space-y-6">
                        {/* Total Tasks Badge */}
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-600">Total Tasks</span>
                            <span className="text-2xl font-bold text-slate-900">{stats.taskMetrics.total}</span>
                        </div>

                        {/* Progress Bars */}
                        <div className="space-y-4">
                            {/* Completed */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Completed</span>
                                    <span className="font-medium text-slate-900">{stats.taskMetrics.completed} ({getPercent(stats.taskMetrics.completed)}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${getPercent(stats.taskMetrics.completed)}%` }}></div>
                                </div>
                            </div>

                            {/* Active */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Active</span>
                                    <span className="font-medium text-slate-900">{stats.taskMetrics.active} ({getPercent(stats.taskMetrics.active)}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${getPercent(stats.taskMetrics.active)}%` }}></div>
                                </div>
                            </div>

                            {/* Delayed */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">Delayed</span>
                                    <span className="font-medium text-slate-900">{stats.taskMetrics.delayed} ({getPercent(stats.taskMetrics.delayed)}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${getPercent(stats.taskMetrics.delayed)}%` }}></div>
                                </div>
                            </div>

                            {/* On-Time Rate (Circular or special bar) */}
                            <div className="pt-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600">On-Time Completion Rate</span>
                                    <span className="font-medium text-slate-900">{stats.taskMetrics.onTimePercentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5">
                                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${stats.taskMetrics.onTimePercentage}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white shadow-sm rounded-xl border border-slate-100">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-lg font-medium text-slate-900">Recent Activity</h2>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto max-h-[400px]">
                        {activity.length > 0 ? (
                            activity.map((item) => (
                                <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full
                                            ${item.type === 'task' ? 'bg-blue-100 text-blue-800' :
                                                item.type === 'event' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-green-100 text-green-800'}`}>
                                            {item.type.toUpperCase()}
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{item.title}</p>
                                            <p className="text-xs text-slate-500">Status: {item.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-400">
                                        {new Date(item.date).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center text-slate-500">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
