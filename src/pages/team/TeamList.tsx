import React, { useEffect, useState } from 'react';
import { teamService } from '../../services/team';
import type { Profile } from '../../types';
import TeamMemberCard from '../../components/team/TeamMemberCard';
import InviteMemberModal from '../../components/team/InviteMemberModal';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const TeamList: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // We'll simplisticly determine current user role by finding them in the list or assume from context if we had it there
    // Ideally AuthContext would provide the full profile including role. 
    // For now, let's fetch the list and find ourselves.
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

    const fetchTeam = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out. Check your network or Supabase configuration.')), 10000)
            );

            // Race the fetch against the timeout
            const data = await Promise.race([
                teamService.getTeamMembers(),
                timeoutPromise
            ]) as Profile[];

            setMembers(data);

            if (currentUser) {
                const me = data.find(p => p.id === currentUser.id);
                setCurrentUserProfile(me || null);
            }
        } catch (err: any) {
            console.error('Fetch team error:', err);
            setError(err.message || 'Failed to load team members');
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    const handleUpdateRole = async (userId: string, newRole: 'Admin' | 'Manager' | 'Employee') => {
        try {
            await teamService.updateMemberRole(userId, newRole);
            // Optimistic update or refetch
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
        } catch (err: unknown) {
            console.error('Failed to update role:', err);
            alert('Failed to update role');
        }
    };

    const handleInvite = async (email: string) => {
        await teamService.inviteMember(email);
        alert(`Invitation sent to ${email}`);
        // In a real app, maybe add a "Pending" member to the list
    };

    if (loading) {
        return <div className="text-center py-12">Loading team...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <Button variant="secondary" onClick={fetchTeam} className="mt-4">Retry</Button>
            </div>
        );
    }

    const handleUpdateStatus = async (userId: string, newStatus: 'Active' | 'Suspended' | 'Pending') => {
        try {
            await teamService.updateMemberStatus(userId, newStatus);
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, status: newStatus } : m));
        } catch (err: unknown) {
            console.error('Failed to update status:', err);
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
                    <p className="text-slate-500">Manage your team and their roles.</p>
                </div>
                {currentUserProfile?.role === 'Admin' && (
                    <Button onClick={() => setIsInviteModalOpen(true)}>
                        Invite Member
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map(member => (
                    <TeamMemberCard
                        key={member.id}
                        member={member}
                        onUpdateRole={handleUpdateRole}
                        onUpdateStatus={handleUpdateStatus}
                        currentUserRole={currentUserProfile?.role}
                    />
                ))}
            </div>

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInvite={handleInvite}
            />
        </div>
    );
};

export default TeamList;
