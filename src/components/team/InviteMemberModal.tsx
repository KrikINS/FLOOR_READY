import React, { useState } from 'react';
import Button from '../ui/Button';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string) => Promise<void>;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, onInvite }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await onInvite(email);
            setEmail('');
            onClose();
        } catch (err: unknown) {
            console.error(err);
            setError((err as Error).message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Invite New Member</h2>

                {error && (
                    <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            Send Invitation
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteMemberModal;
