import { supabase } from './supabase';

export interface DashboardStats {
    activeTasks: number;
    pendingExpenses: number;
    totalTeam: number;
    taskMetrics: {
        total: number;
        completed: number;
        active: number;
        delayed: number;
        onTimePercentage: number;
    };
}

export interface RecentActivity {
    id: string;
    type: 'task' | 'event' | 'expense';
    title: string;
    status: string;
    date: string; // ISO string
}

export const dashboardService = {
    async getStats() {
        // Parallelize queries for performance
        const [tasksResponse, expenses, team] = await Promise.all([
            // Fetch all tasks to calculate metrics
            supabase
                .from('tasks')
                .select('id, status, deadline, completed_at, created_at'),
            supabase
                .from('expense_requests')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'Pending'),
            supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true })
        ]);

        const tasks = tasksResponse.data || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;
        const activeTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;

        // Calculate Delayed Tasks (Active and past deadline)
        const now = new Date();
        const delayedTasks = tasks.filter(t => {
            if (t.status === 'Completed' || t.status === 'Cancelled' || !t.deadline) return false;
            return new Date(t.deadline) < now;
        }).length;

        // Calculate On-Time Percentage (Completed tasks where completed_at <= deadline)
        const tasksWithDeadlines = tasks.filter(t => t.status === 'Completed' && t.deadline);
        const onTimeTasks = tasksWithDeadlines.filter(t => {
            return t.completed_at && t.deadline && new Date(t.completed_at) <= new Date(t.deadline);
        }).length;

        // Base percentage on completed tasks with deadlines, or 0 if none
        const onTimePercentage = tasksWithDeadlines.length > 0
            ? Math.round((onTimeTasks / tasksWithDeadlines.length) * 100)
            : 100; // Default to 100% if no completed tasks with deadlines to avoid "0%" looking bad initially

        return {
            activeTasks, // Use calculated active count
            pendingExpenses: expenses.count || 0,
            totalTeam: team.count || 0,
            taskMetrics: {
                total: totalTasks,
                completed: completedTasks,
                active: activeTasks,
                delayed: delayedTasks,
                onTimePercentage
            }
        };
    },

    async getRecentActivity(limit = 5): Promise<RecentActivity[]> {
        // 1. Get recent tasks
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title, status, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        // 2. Get recent events
        const { data: events } = await supabase
            .from('events')
            .select('id, title, date') // Events use 'date' usually
            .order('created_at', { ascending: false })
            .limit(limit);

        // Normalize and combine
        const formattedTasks = (tasks || []).map(t => ({
            id: t.id,
            type: 'task' as const,
            title: t.title,
            status: t.status,
            date: t.created_at
        }));

        const formattedEvents = (events || []).map(e => ({
            id: e.id,
            type: 'event' as const,
            title: e.title,
            status: 'Scheduled', // Events don't strictly have status in same way usually
            date: e.date // Use the event date, or created_at if preferred for "activity feed"
        }));

        // Combine and sort by date descending
        const combined = [...formattedTasks, ...formattedEvents]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, limit);

        return combined;
    }
};
