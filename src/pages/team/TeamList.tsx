import React, { useEffect, useState } from 'react';
import { teamService } from '../../services/team';
import type { Profile } from '../../types';
import TeamMemberCard from '../../components/team/TeamMemberCard';
import AddUserModal from '../../components/team/AddUserModal';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const TeamList: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

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

    const handleUpdateRole = async (userId: string, newRole: 'Admin' | 'Manager' | 'Staff') => {
        try {
            await teamService.updateMemberRole(userId, newRole);
            // Optimistic update or refetch
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
        } catch (err: unknown) {
            console.error('Failed to update role:', err);
            alert('Failed to update role');
        }
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

    const handleDeleteUser = async (userId: string) => {
        try {
            await teamService.deleteMember(userId);
            setMembers(prev => prev.filter(m => m.id !== userId));
        } catch (err: any) {
            console.error('Failed to delete user:', err);
            // Helpful error message if RPC is missing
            if (err.message && err.message.includes('function delete_user') && err.message.includes('does not exist')) {
                alert('Missing SQL Function! Please run the "db/rpc_delete_user.sql" script in Supabase.');
            } else {
                alert('Failed to delete user: ' + err.message);
            }
        }
    };

    // Use robust role check from metadata if available (from our new AuthContext)
    // fallback to fetched profile
    // HOTFIX: Hardcode owner email to always be Admin to prevent lockout
    const isOwner = currentUser?.email === 'anees.ahad1007@gmail.com';
    const currentRole = currentUser?.user_metadata?.role || currentUserProfile?.role;
    const canAddUser = isOwner || currentRole === 'Admin' || currentRole === 'Manager';

    return (
        <div className="space-y-6">
            {/* DEBUGGING BLOCK - REMOVE AFTER FIXING */}
            <div className="bg-yellow-50 p-2 border border-yellow-200 rounded text-xs font-mono text-yellow-800 mb-4">
                <strong>DEBUG INFO:</strong><br />
                Email: {currentUser?.email}<br />
                IsOwner: {isOwner ? 'YES' : 'NO'}<br />
                Role Override: {isOwner ? 'Admin' : currentRole}<br />
                Can Add User: {canAddUser ? 'YES' : 'NO'}
            </div>
            {/* END DEBUGGING BLOCK */}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                    <p className="text-slate-500">Create, manage, and assign roles to your team.</p>
                </div>
                {canAddUser && (
                    <Button onClick={() => setIsAddUserModalOpen(true)}>
                        + Add New User
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map(member => (
                    <TeamMemberCard
                        key={member.id}
                        member={member}
                        currentUserRole={isOwner ? 'Admin' : currentRole}
                        onUpdateRole={handleUpdateRole}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDeleteUser}
                    />
                ))}
            </div>

            {!loading && members.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">No team members found.</p>
                </div>
            )}

            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={() => setIsAddUserModalOpen(false)}
                onUserAdded={fetchTeam}
            />
        </div>
    );
};

export default TeamList;
