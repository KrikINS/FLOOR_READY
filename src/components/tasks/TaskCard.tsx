import React, { useState } from 'react';
import type { Task } from '../../types';
import TaskStatusBadge from './TaskStatusBadge';
import TaskActionModal from './TaskActionModal';
// Removed react-router-dom Link since we are using modal now

interface TaskCardProps {
    task: Task;
}

const TaskCard: React.FC<TaskCardProps & { onTaskUpdated?: () => void, currentUser?: any }> = ({ task, onTaskUpdated, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const priorityColor = {
        Low: 'text-slate-500',
        Medium: 'text-blue-500',
        High: 'text-orange-500',
        Urgent: 'text-red-600 font-bold',
    };

    return (
        <>
            <div
                className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer relative"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <div className="text-lg font-medium text-slate-900 hover:text-primary block truncate">
                            {task.title}
                        </div>
                        {task.events?.name && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {task.events.name}
                            </span>
                        )}
                    </div>
                    <TaskStatusBadge status={task.status} />
                </div>

                <p className="text-sm text-slate-600 line-clamp-2 mb-3 h-10">
                    {task.description || 'No description.'}
                </p>

                <div className="flex justify-between items-center text-xs text-slate-500 border-t pt-3 border-slate-100">
                    <div className="flex items-center space-x-2">
                        {task.priority && (
                            <span className={`${priorityColor[task.priority]} font-medium`}>
                                {task.priority}
                            </span>
                        )}
                        <span>•</span>
                        <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </div>

                    {task.profiles && (
                        <div className="flex items-center" title={task.profiles.full_name || 'Assignee'}>
                            {task.profiles.avatar_url ? (
                                <img src={task.profiles.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                            ) : (
                                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {task.profiles.full_name?.charAt(0) || '?'}
                                </div>
                            )}
                            <span className="ml-2 hidden sm:inline">{task.profiles.full_name}</span>
                        </div>
                    )}
                </div>
            </div>

            <TaskActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={task}
                onTaskUpdated={() => {
                    if (onTaskUpdated) onTaskUpdated();
                }}
                currentUser={currentUser}
            />
        </>
    );
};

export default TaskCard;
