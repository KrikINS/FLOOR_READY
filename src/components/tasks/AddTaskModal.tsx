import React, { useState, useEffect } from 'react';
import { tasksService } from '../../services/tasks';
import { teamService } from '../../services/team';
import { inventoryService } from '../../services/inventory';
import { eventsService } from '../../services/events';
import type { Profile, InventoryItem, TaskPriority, Event } from '../../types';
import Button from '../ui/Button';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
    eventId?: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onTaskCreated, eventId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('Medium');
    const [deadline, setDeadline] = useState('');
    const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);

    // Initialize with prop if available, otherwise empty string
    const [selectedEventId, setSelectedEventId] = useState(eventId || '');

    const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (eventId) {
            setSelectedEventId(eventId);
        }
    }, [eventId]);

    const loadData = async () => {
        try {
            // Define promises with specific return types to avoid 'any'
            const membersPromise = teamService.getTeamMembers();
            const inventoryPromise = inventoryService.getInventory();

            const promises: [Promise<Profile[]>, Promise<InventoryItem[]>, Promise<Event[]> | Promise<null>] = [
                membersPromise,
                inventoryPromise,
                !eventId ? eventsService.getEvents() : Promise.resolve(null)
            ];

            const [members, inventory, events] = await Promise.all(promises);

            setTeamMembers(members);
            setInventoryItems(inventory);
            if (events) {
                setAvailableEvents(events);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load form data');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation: Must have an event ID
        if (!selectedEventId) {
            setError('Please select an event.');
            setLoading(false);
            return;
        }

        try {
            await tasksService.createTaskWithInventory({
                event_id: selectedEventId,
                title,
                description,
                assignee_id: assigneeId || null,
                priority,
                status: 'Not Started',
                deadline: deadline ? new Date(deadline).toISOString() : null,
            }, selectedInventoryIds);

            onTaskCreated();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setAssigneeId('');
            setPriority('Medium');
            setDeadline('');
            setSelectedInventoryIds([]);
            // Only reset event selection if it wasn't fixed by prop
            if (!eventId) setSelectedEventId('');
        } catch (err: any) {
            console.error('Task creation failed:', err);
            // Surface the specific error message if available
            const errorMessage = err.message || err.error_description || 'Failed to create task';
            setError(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleInventoryItem = (id: string) => {
        setSelectedInventoryIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">Add New Task</h3>
                        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            {/* Event Selection - Only show if no fixed eventId */}
                            {!eventId && (
                                <div>
                                    <label htmlFor="task-event" className="block text-sm font-medium text-slate-700">Event</label>
                                    <select
                                        id="task-event"
                                        required
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        value={selectedEventId}
                                        onChange={e => setSelectedEventId(e.target.value)}
                                    >
                                        <option value="">Select an Event...</option>
                                        {availableEvents.map(evt => (
                                            <option key={evt.id} value={evt.id}>{evt.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label htmlFor="task-title" className="block text-sm font-medium text-slate-700">Title</label>
                                <input
                                    id="task-title"
                                    type="text"
                                    required
                                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="task-desc" className="block text-sm font-medium text-slate-700">Description</label>
                                <textarea
                                    id="task-desc"
                                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    rows={3}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="task-assignee" className="block text-sm font-medium text-slate-700">Assignee</label>
                                    <select
                                        id="task-assignee"
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        value={assigneeId}
                                        onChange={e => setAssigneeId(e.target.value)}
                                    >
                                        <option value="">Unassigned</option>
                                        {teamMembers.map(member => (
                                            <option key={member.id} value={member.id}>{member.full_name || 'Unnamed'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700">Priority</label>
                                    <select
                                        id="task-priority"
                                        className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                        value={priority}
                                        onChange={e => setPriority(e.target.value as TaskPriority)}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="task-deadline" className="block text-sm font-medium text-slate-700">Deadline</label>
                                <input
                                    id="task-deadline"
                                    type="date"
                                    className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Required Inventory</label>
                                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-md p-2 space-y-2">
                                    {inventoryItems.map(item => (
                                        <div key={item.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`inv-${item.id}`}
                                                checked={selectedInventoryIds.includes(item.id)}
                                                onChange={() => toggleInventoryItem(item.id)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor={`inv-${item.id}`} className="ml-2 block text-sm text-slate-900">
                                                {item.item_name} (Stock: {item.current_stock})
                                            </label>
                                        </div>
                                    ))}
                                    {inventoryItems.length === 0 && <p className="text-sm text-slate-500">No inventory items available.</p>}
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Task'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTaskModal;
