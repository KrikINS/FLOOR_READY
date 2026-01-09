import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsService } from '../../services/events';
import Button from '../../components/ui/Button';

const NewEvent: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        status: 'Planning' as const,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await eventsService.createEvent({
                ...formData,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
            });
            navigate('/events');
        } catch (err) {
            console.error(err);
            setError('Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Create New Event</h1>
                <p className="mt-1 text-sm text-slate-500">Fill in the details for the new event.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                        Event Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                        Description
                    </label>
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                        Location
                    </label>
                    <input
                        type="text"
                        name="location"
                        id="location"
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                        value={formData.location}
                        onChange={handleChange}
                    />
                </div>

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-slate-700">
                            Start Date
                        </label>
                        <input
                            type="datetime-local"
                            name="start_date"
                            id="start_date"
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                            value={formData.start_date}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-slate-700">
                            End Date
                        </label>
                        <input
                            type="datetime-local"
                            name="end_date"
                            id="end_date"
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                            value={formData.end_date}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                    <Button type="button" variant="secondary" onClick={() => navigate('/events')}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Create Event
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default NewEvent;
