import React from 'react';
import type { Profile } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

// ...
interface TeamMemberCardProps {
    member: Profile;
    onUpdateRole: (id: string, newRole: 'Admin' | 'Manager' | 'Staff') => Promise<void>;
    onUpdateStatus?: (id: string, newStatus: 'Active' | 'Suspended' | 'Pending') => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    currentUserRole?: string | null;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, onUpdateRole, onUpdateStatus, onDelete, currentUserRole }) => {
    // Permission: Admin can edit anyone (in theory), Manager can maybe edit Staff?
    // For now, let's stick to: Only Admin can change roles.
    // If you want Managers to edit Staff permissions, un-comment the next line:
    // const canEdit = currentUserRole === 'Admin' || (currentUserRole === 'Manager' && member.role === 'Staff');
    // Let's rely on currentUserRole being 'Admin' for ROLE changes for safety.
    const canEditRoles = currentUserRole === 'Admin';
    const canEditStatus = currentUserRole === 'Admin' || currentUserRole === 'Manager';
    const canDelete = currentUserRole === 'Admin';

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">
                    {member.avatar_url ? (
                        <img src={member.avatar_url} alt={member.full_name || 'User'} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                        (member.full_name || 'U').charAt(0).toUpperCase()
                    )}
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-900">{member.full_name || 'Unknown User'}</h3>
                    <p className="text-sm text-slate-500">{member.phone || 'No phone'}</p>
                </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
                <div className="flex space-x-2">
                    <Badge variant={
                        member.status === 'Active' ? 'success' :
                            member.status === 'Pending' ? 'warning' : 'error'
                    }>
                        {member.status || 'Pending'}
                    </Badge>
                    <Badge variant={
                        member.role === 'Admin' ? 'primary' :
                            member.role === 'Manager' ? 'warning' : 'default'
                    }>
                        {member.role || 'Staff'}
                    </Badge>
                </div>

                <div className="flex flex-col space-y-1 items-end">
                    {canEditStatus && member.status === 'Pending' && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onUpdateStatus?.(member.id, 'Active')}
                        >
                            Approve User
                        </Button>
                    )}

                    {canEditRoles && (
                        <div className="flex space-x-2">
                            {member.role !== 'Admin' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onUpdateRole(member.id, 'Admin')}
                                    title="Promote to Admin"
                                >
                                    Make Admin
                                </Button>
                            )}
                            {member.role !== 'Manager' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onUpdateRole(member.id, 'Manager')}
                                    title="Promote to Manager"
                                >
                                    Make Manager
                                </Button>
                            )}
                            {member.role !== 'Staff' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onUpdateRole(member.id, 'Staff')}
                                    title="Demote to Staff"
                                >
                                    Make Staff
                                </Button>
                            )}
                        </div>
                    )}

                    {canDelete && onDelete && (
                        <div className="mt-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                    if (confirm('Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.')) {
                                        // We need a way to pass this up. 
                                        // Since we don't have onDelete prop yet, we might need to cast or update props.
                                        // Actually, let's look at the Props interface first.
                                        // The user asked to "add an option", so I need to update the parent too.
                                        // I'll emit a custom event or, better, update the props in the next step.
                                        // For now, let's assume `onDelete` is passed.
                                        // WAIT: I need to update the interface first.
                                        // Let's defer this change to the next tool call where I update the Interface AND the component.
                                    }
                                }}
                            >
                                Delete User
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamMemberCard;
