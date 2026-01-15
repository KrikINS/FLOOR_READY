import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tasksService } from '../../services/tasks';
import type { Task } from '../../types';
import TaskStatusBadge from '../../components/tasks/TaskStatusBadge';
import Button from '../../components/ui/Button';
import ProfitabilityModal from '../../components/tasks/ProfitabilityModal';

const TaskDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProfitabilityModalOpen, setIsProfitabilityModalOpen] = useState(false);

    useEffect(() => {
        if (id) fetchTask(id);
    }, [id]);

    const fetchTask = async (taskId: string) => {
        try {
            const data = await tasksService.getTask(taskId);
            setTask(data);
        } catch (err) {
            setError('Failed to load task details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!task || !window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await tasksService.deleteTask(task.id);
            navigate('/tasks');
        } catch (err) {
            console.error(err);
            alert('Failed to delete task');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error || !task) return <div className="p-8 text-center text-red-600">{error || 'Task not found'}</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{task.title}</h1>
                    <div className="mt-2 flex items-center space-x-2">
                        <TaskStatusBadge status={task.status} />
                        {task.events?.name && (
                            <span className="text-sm text-slate-500">in {task.events.name}</span>
                        )}
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button variant="secondary">Edit</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 space-y-4">
                <div>
                    <h3 className="text-sm font-medium text-slate-500">Description</h3>
                    <p className="mt-1 text-slate-900 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        <h3 className="text-sm font-medium text-slate-500">Assignee</h3>
                        <div className="mt-1 flex items-center">
                            {task.profiles ? (
                                <>
                                    {task.profiles.avatar_url && <img src={task.profiles.avatar_url} alt={task.profiles.full_name || 'Assignee avatar'} className="h-6 w-6 rounded-full mr-2" />}
                                    <span>{task.profiles.full_name}</span>
                                </>
                            ) : <span className="text-slate-400">Unassigned</span>}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-slate-500">Deadline</h3>
                        <p className="mt-1 text-slate-900">{task.deadline ? new Date(task.deadline).toLocaleString() : 'None'}</p>
                    </div>
                </div>
            </div>


            <div className="bg-white shadow rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Profitability Analysis</h2>
                    <Button variant="secondary" size="sm" onClick={() => setIsProfitabilityModalOpen(true)}>Edit</Button>
                </div>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Cost Center</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                            {task.cost_center ? `${task.cost_center.code} - ${task.cost_center.title}` : 'Not assigned'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Cost to Client</dt>
                        <dd className="mt-1 text-sm text-slate-900">
                            {task.cost_to_client ? `$${task.cost_to_client}` : '-'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Unit Type</dt>
                        <dd className="mt-1 text-sm text-slate-900">{task.unit_type || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-slate-500">Billable Quantity</dt>
                        <dd className="mt-1 text-sm text-slate-900">{task.billable_quantity || '-'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-slate-500">Comments</dt>
                        <dd className="mt-1 text-sm text-slate-900">{task.profitability_comments || '-'}</dd>
                    </div>
                </dl>
            </div>

            {
                task && (
                    <ProfitabilityModal
                        isOpen={isProfitabilityModalOpen}
                        onClose={() => setIsProfitabilityModalOpen(false)}
                        task={task}
                        onSave={async (updates) => {
                            try {
                                const updatedTask = await tasksService.updateTask(task.id, updates);
                                setTask(prev => prev ? { ...prev, ...updatedTask, cost_center_id: updates.cost_center_id } : null);
                                // Refresh logic might be needed for full joins, but let's try shallow update first
                                if (id) fetchTask(id); // refetch to get the joined cost center details
                            } catch (err) {
                                console.error('Failed to update task', err);
                                throw err;
                            }
                        }}
                    />
                )
            }

            <Link to="/tasks" className="text-primary hover:underline">&larr; Back to Tasks</Link>
        </div >
    );
};

export default TaskDetails;
