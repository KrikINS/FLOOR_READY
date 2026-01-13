import React from 'react';
import Badge from '../ui/Badge';
import type { TaskStatus } from '../../types';

interface TaskStatusBadgeProps {
    status: TaskStatus;
}

const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({ status }) => {
    const variantMap: Record<TaskStatus, 'default' | 'success' | 'warning' | 'error' | 'primary'> = {
        'Pending': 'default',
        'Acknowledged': 'primary',
        'In Review': 'warning',
        'In Progress': 'primary',
        'Awaiting Approval': 'warning',
        'Completed': 'success',
        'On Hold': 'error',
    };

    const variant = variantMap[status] || 'default';

    return <Badge variant={variant}>{status}</Badge>;
};

export default TaskStatusBadge;
