import React, { useEffect, useState } from 'react';
import { tasksService } from '../../services/tasks';
import { teamService } from '../../services/team';
import type { Task, Profile } from '../../types';
import TaskCard from '../../components/tasks/TaskCard';
import Button from '../../components/ui/Button';
import AddTaskModal from '../../components/tasks/AddTaskModal';
import ErrorBoundary from '../../components/ErrorBoundary';

const TasksList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch user first to ensure it's ready
                await fetchCurrentUser();
                await fetchTasks();
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const profile = await teamService.getCurrentProfile();
            setCurrentUser(profile);
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    };

    const fetchTasks = async () => {
        try {
            const data = await tasksService.getTasks();
            setTasks(data);
        } catch (err: any) {
            console.error('Error fetching tasks details:', err);
            setError(err.message || 'Failed to load tasks.');
        }
        // Loading handled in init
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            View and manage all tasks across events.
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        Create Task
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                {tasks.length === 0 && !error ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-slate-500">No tasks found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {tasks?.map && tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onTaskUpdated={fetchTasks}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}

                <AddTaskModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onTaskCreated={fetchTasks}
                    currentUser={currentUser}
                />
            </div>
        </ErrorBoundary>
    );
};

export default TasksList;
