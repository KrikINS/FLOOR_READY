import React from 'react';
import type { Profile } from '../../types';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface TeamMemberCardProps {
    member: Profile;
    onUpdateRole: (id: string, newRole: 'Admin' | 'Manager' | 'Employee') => Promise<void>;
    currentUserRole?: string | null;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, onUpdateRole, currentUserRole }) => {
    // Simple checks for permission (only Admins can change roles, for example)
    const canEdit = currentUserRole === 'Admin';

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

            <div className="flex items-center space-x-4">
                <Badge variant={
                    member.role === 'Admin' ? 'primary' :
                        member.role === 'Manager' ? 'warning' : 'default'
                }>
                    {member.role || 'Employee'}
                </Badge>

                {canEdit && (
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
                        {member.role !== 'Employee' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUpdateRole(member.id, 'Employee')}
                                title="Demote to Employee"
                            >
                                Make Employee
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamMemberCard;
