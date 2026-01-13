import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tasksService } from '../../services/tasks';
import type { Task } from '../../types';
import TaskCard from '../../components/tasks/TaskCard';
import Button from '../../components/ui/Button';
import AddTaskModal from '../../components/tasks/AddTaskModal';
import TaskActionModal from '../../components/tasks/TaskActionModal';
import ErrorBoundary from '../../components/ErrorBoundary';

const TaskRow = ({ task, onTaskUpdated, currentUser }: { task: Task, onTaskUpdated: () => void, currentUser: any }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-900 font-medium text-sm hover:underline"
            >
                details
            </button>

            <TaskActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={task}
                onTaskUpdated={onTaskUpdated}
                currentUser={currentUser}
            />
        </>
    );
};

const TasksList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const { profile: currentUser, loading: authLoading } = useAuth(); // Use global profile
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

    const fetchTasks = async () => {
        try {
            const data = await tasksService.getTasks();
            setTasks(data);
        } catch (err: any) {
            console.error('Error fetching tasks details:', err);
            setError(err.message || 'Failed to load tasks.');
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                await fetchTasks();
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setLoadingTasks(false);
            }
        };
        init();
    }, []);

    // Show loading spinner if either auth or tasks are loading
    if (authLoading || loadingTasks) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }



    // Filter and Sort Tasks
    const sortedTasks = [...tasks].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const activeTasks = sortedTasks.filter(t => t.status !== 'Completed');
    const completedTasks = sortedTasks.filter(t => t.status === 'Completed');

    // List View Component
    const TaskTable = ({ taskList }: { taskList: Task[] }) => (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {taskList.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">{task.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${task.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'}`}>
                                    {task.priority || 'Normal'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-700">{task.status}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {task.profiles?.full_name || 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => {
                                        // We need a way to open the modal from the row. 
                                        // The current TaskCard handles its own modal.
                                        // Since we don't have a shared state for specific task modal in parent, 
                                        // we'll render a TaskCard button trigger or we need to lift the modal state up?
                                        // Actually, TaskCard opens TaskActionModal.
                                        // TO KEEP SIMPLE: We will render a hidden TaskCard trigger or restructure.
                                        // BETTER PLAN: Render TaskCard wrapper or duplicate the trigger logic?
                                        // Re-using TaskCard in a hidden way is hacky.
                                        // Let's just make the whole row clickable or add a "View" button that sets a state.
                                        // Wait, TaskCard holds the modal state internally!
                                        // We should refactor to lift modal state up, BUT that's a larger refactor.
                                        // SHORTCUT: Just render a minimal TaskCard-like button that opens the modal? No, TaskCard owns the modal.
                                        // OK, for now, let's wrap the row in a component that mimics TaskCard's modal behavior
                                        // OR, let's just create a `TaskRow` component that behaves like `TaskCard`.
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900"
                                >

                                </button>
                                {/* Use TaskRow for list view actions */}
                                <TaskRow task={task} onTaskUpdated={fetchTasks} currentUser={currentUser} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Helper component for List View Row (Duplicates TaskCard modal logic slightly or we can extract it later)
    // Actually, we can just use TaskCard but style it differently? No, structure is too different.
    // Let's create a minimal TaskRow inline for now to avoid file sprawl, moving it to separate file if needed.

    // ... wait, I can't define component inside render easily for generic usage.
    // I'll define `TaskRow` at bottom of file or modify TaskCard to support 'row' mode?
    // Modifying TaskCard to multiple modes is cleaner.
    // But I will just make a small inline component for now to save time and complexity.

    // Render Helper
    const renderTaskList = (taskList: Task[], title: string, emptyMsg: string, isCompletedColumn = false) => {
        if (viewMode === 'list') {
            return (
                <div className="mb-8">
                    <h2 className={`text-lg font-semibold mb-4 flex items-center ${isCompletedColumn ? 'text-green-700' : 'text-slate-700'}`}>
                        {title}
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {taskList.length}
                        </span>
                    </h2>
                    {taskList.length === 0 ? <p className="text-slate-400 text-sm italic py-4">{emptyMsg}</p> : <TaskTable taskList={taskList} />}
                </div>
            );
        }

        return (
            <div className="flex-1 min-w-0">
                <h2 className={`text-lg font-semibold mb-4 flex items-center ${isCompletedColumn ? 'text-green-700' : 'text-slate-700'}`}>
                    {title}
                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {taskList.length}
                    </span>
                </h2>

                {taskList.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-slate-100">
                        <p className="text-slate-400 text-sm">{emptyMsg}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {taskList.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onTaskUpdated={fetchTasks}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <ErrorBoundary>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your workflow.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                            <button
                                onClick={() => setViewMode('board')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all flex items-center gap-2
                                    ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                Board
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-sm transition-all flex items-center gap-2
                                    ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                List
                            </button>
                        </div>

                        <Button onClick={() => setShowCreateModal(true)}>
                            Create Task
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                        {error}
                    </div>
                )}

                {!error && (
                    <div className={viewMode === 'board' ? "flex flex-col lg:flex-row gap-8" : "flex flex-col gap-8"}>
                        {renderTaskList(activeTasks, 'Active Tasks', 'No active tasks.', false)}
                        {renderTaskList(completedTasks, 'Completed Tasks', 'No completed tasks yet.', true)}
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
