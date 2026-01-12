import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';
import { eventsService } from '../../services/events';
import EventCard from '../../components/events/EventCard';
import Button from '../../components/ui/Button';

const EventsList: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await eventsService.getEvents();
            setEvents(data);
        } catch (err) {
            setError('Failed to load events. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await eventsService.deleteEvent(id);
            // Refresh list
            setEvents(events.filter(e => e.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete event. You may not have permission.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Events</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage your upcoming events and tasks
                    </p>
                </div>
                <Link to="/events/new">
                    <Button>
                        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Event
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            {events.length === 0 && !error ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No events</h3>
                    <p className="mt-1 text-sm text-slate-500">Get started by creating a new event.</p>
                    <div className="mt-6">
                        <Link to="/events/new">
                            <Button>Create Event</Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventsList;
