import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Event, Task } from '../../types';
import { eventsService } from '../../services/events';
import { tasksService } from '../../services/tasks';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import TaskCard from '../../components/tasks/TaskCard';
import AddTaskModal from '../../components/tasks/AddTaskModal';

const EventDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'inventory'>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEventData(id);
        }
    }, [id]);

    const fetchEventData = async (eventId: string) => {
        try {
            // Fetch event details
            try {
                const eventData = await eventsService.getEvent(eventId);
                setEvent(eventData);
            } catch (eventErr) {
                console.error('Error fetching event:', eventErr);
                throw new Error('Failed to load event data');
            }

            // Fetch tasks (non-blocking for critical UI)
            try {
                const tasksData = await tasksService.getTasksByEvent(eventId);
                setTasks(tasksData);
            } catch (taskErr) {
                console.error('Error fetching tasks:', taskErr);
                // Don't block loading the event if tasks fail
            }

        } catch (err) {
            setError('Failed to load event details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event || !window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;

        try {
            await eventsService.deleteEvent(event.id);
            navigate('/events');
        } catch (err) {
            console.error(err);
            alert('Failed to delete event');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-slate-900">Error loading event</h3>
                <p className="mt-1 text-slate-500">{error || 'Event not found'}</p>
                <div className="mt-6">
                    <Link to="/events" className="text-primary hover:text-blue-700">
                        &larr; Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
                            <Badge>{event.status}</Badge>
                        </div>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            {event.location} • {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="secondary" onClick={() => alert('Edit Implementation coming soon')}>Edit</Button>
                        <Button variant="danger" onClick={handleDelete}>Delete</Button>
                    </div>
                </div>
                <div className="border-t border-slate-200 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-slate-500">Description</dt>
                            <dd className="mt-1 text-sm text-slate-900">{event.description || 'No description provided.'}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Tasks ({tasks.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`${activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Inventory (Coming Soon)
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
                {activeTab === 'overview' && (
                    <div className="text-slate-500 text-center py-8">Statistics and overview widgets will go here.</div>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-slate-900">Event Tasks</h3>
                            <Button size="sm" onClick={() => setShowAddTaskModal(true)}>+ Add Task</Button>
                        </div>
                        {tasks.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {tasks.map(task => <TaskCard key={task.id} task={task} />)}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-8">No tasks assigned to this event yet.</p>
                        )}
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="text-slate-500 text-center py-8">Inventory items for this event will be listed here.</div>
                )}
            </div>
            {id && (
                <AddTaskModal
                    isOpen={showAddTaskModal}
                    onClose={() => setShowAddTaskModal(false)}
                    onTaskCreated={() => id && fetchEventData(id)}
                    eventId={id}
                />
            )}
        </div>
    );
};

export default EventDetails;
