import React from 'react';
import Badge from '../ui/Badge';
import type { TaskStatus } from '../../types';

interface TaskStatusBadgeProps {
    status: TaskStatus;
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
    const variantMap: Record<TaskStatus, 'default' | 'success' | 'warning' | 'error'> = {
        'Not Started': 'default',
        'In Progress': 'warning',
        'Completed': 'success',
        'On Hold': 'error',
    };

    return <Badge variant={variantMap[status]}>{status}</Badge>;
};

export default TaskStatusBadge;
