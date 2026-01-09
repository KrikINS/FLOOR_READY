import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../types';
import Badge from '../ui/Badge';

interface EventCardProps {
    event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const statusVariant = {
        Planning: 'default',
        Active: 'success',
        Completed: 'default', // or a specific 'done' color
        Cancelled: 'error',
    } as const;

    return (
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 truncate">
                        {event.name}
                    </h3>
                    <Badge variant={statusVariant[event.status] || 'default'}>
                        {event.status}
                    </Badge>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-slate-500 line-clamp-2">
                    {event.description || 'No description provided.'}
                </p>
                <div className="mt-4 flex items-center text-sm text-slate-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {event.location || 'No location set'}
                </div>
                <div className="mt-2 flex items-center text-sm text-slate-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}
                </div>
            </div>
            <div className="bg-slate-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                    <Link to={`/events/${event.id}`} className="font-medium text-primary hover:text-blue-700">
                        View Details <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
