import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsService } from '../../services/events';
import { costCenterService } from '../../services/costCenters';
import type { CostCenter, EventStatus } from '../../types';
import Button from '../../components/ui/Button';

const EditEvent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        status: 'Planning' as EventStatus,
        cost_center_code: '',
    });

    useEffect(() => {
        if (id) {
            fetchData(id);
        }
    }, [id]);

    const fetchData = async (eventId: string) => {
        try {
            setLoading(true);
            const [event, costCentersData] = await Promise.all([
                eventsService.getEvent(eventId),
                costCenterService.getCostCenters()
            ]);

            setCostCenters(costCentersData);

            // Format dates for input fields (YYYY-MM-DDThh:mm)
            const formatForInput = (dateStr: string | null) => {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                // Adjust to local time string for input
                return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            };

            setFormData({
                name: event.name,
                description: event.description || '',
                location: event.location || '',
                start_date: formatForInput(event.start_date),
                end_date: formatForInput(event.end_date),
                status: event.status,
                cost_center_code: event.cost_center_code || '',
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load event details.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setError(null);
        setSaving(true);

        try {
            await eventsService.updateEvent(id, {
                ...formData,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
                end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
                cost_center_code: formData.cost_center_code || null,
            });
            navigate(`/events/${id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to update event. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button className="mt-4" onClick={() => navigate('/events')}>Back to Events</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Edit Event</h1>
                <p className="mt-1 text-sm text-slate-500">Update event details.</p>
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

                <div>
                    <label htmlFor="cost_center_code" className="block text-sm font-medium text-slate-700">
                        Cost Center
                    </label>
                    <select
                        id="cost_center_code"
                        name="cost_center_code"
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                        value={formData.cost_center_code}
                        onChange={handleChange}
                    >
                        <option value="">Select a Cost Center</option>
                        {costCenters.map(cc => (
                            <option key={cc.id} value={cc.code}>
                                {cc.code} - {cc.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                    <Button type="button" variant="secondary" onClick={() => navigate(`/events/${id}`)}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={saving}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditEvent;
