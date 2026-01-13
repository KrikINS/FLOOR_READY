import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus, Profile, TaskAttachment } from '../../types';
import Button from '../ui/Button';
import { tasksService } from '../../services/tasks';
import { attachmentsService } from '../../services/attachments';
import { teamService } from '../../services/team';

interface TaskActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    onTaskUpdated: () => void;
    currentUser?: Profile | null;
}

const STEPS: TaskStatus[] = [
    'Pending',
    'Acknowledged',
    // 'In Review', // Combined with Acknowledged
    'In Progress',
    'Awaiting Approval',
    'Completed'
];

const TaskActionModal: React.FC<TaskActionModalProps> = ({
    isOpen,
    onClose,
    task,
    onTaskUpdated,
    currentUser
}) => {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
    const [isReassigning, setIsReassigning] = useState(false);

    // Permission Logic
    const isAssignee = currentUser?.id === task.assignee_id;
    const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
    const currentStepIndex = STEPS.indexOf(task.status);
    // Handle case where existing task might be 'In Review' (treat as Acknowledged index for visual progress)
    const normalizedStepIndex = task.status === 'In Review' ? STEPS.indexOf('Acknowledged') : currentStepIndex;
    const nextStep = STEPS[normalizedStepIndex + 1];

    // Lock and Check logic
    const isLockedForAssignee = isAssignee && task.status === 'Awaiting Approval';
    const canApprove = isAdminOrManager && task.status === 'Awaiting Approval';
    const canMoveForward = isAssignee && !isLockedForAssignee && nextStep;

    const loadAttachments = async () => {
        try {
            const data = await attachmentsService.getAttachments(task.id);
            setAttachments(data);
        } catch (err) {
            console.error('Failed to load attachments', err);
        }
    };

    useEffect(() => {
        const loadTeam = async () => {
            if (isAdminOrManager) {
                try {
                    const members = await teamService.getTeamMembers();
                    setTeamMembers(members);
                } catch (err) {
                    console.error('Failed to load team', err);
                }
            }
        }

        if (isOpen) {
            loadAttachments();
            loadTeam();
        }
    }, [isOpen, task.id, isAdminOrManager]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        setUploading(true);
        setError(null);
        try {
            const context = task.status === 'In Progress' ? 'submission' : 'comment';
            await attachmentsService.uploadAttachment(file, task.id, currentUser.id, context);
            await loadAttachments();
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const handleAction = async (targetStatus?: TaskStatus) => {
        const statusToSet = targetStatus || nextStep;
        if (!statusToSet) return;

        setLoading(true);
        setError(null);

        try {
            const updates: Partial<Task> = { status: statusToSet };
            const now = new Date().toISOString();

            if (statusToSet === 'Acknowledged') {
                updates.acknowledged_at = now;
            } else if (statusToSet === 'Completed') {
                updates.completed_at = now;
            }

            await tasksService.updateTask(task.id, updates);
            onTaskUpdated();
            onClose();
        } catch (err: any) {
            console.error('Failed to update task:', err);
            setError(err.message || 'Failed to update task status');
        } finally {
            setLoading(false);
        }
    };

    const handleReassign = async (newAssigneeId: string) => {
        setLoading(true);
        try {
            await tasksService.updateTask(task.id, { assignee_id: newAssigneeId });
            onTaskUpdated();
            setIsReassigning(false);
        } catch (err: any) {
            console.error('Failed to reassign:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = () => {
        if (!nextStep) return 'Completed';
        switch (nextStep) {
            case 'Acknowledged': return 'Acknowledge & Review'; // Combined label
            case 'In Progress': return 'Start Work';
            case 'Awaiting Approval': return 'Submit for Approval';
            case 'Completed': return 'Approve & Complete';
            default: return 'Next Stage';
        }
    };

    // Upload Permission: ONLY Assignee can upload, and ONLY when 'In Progress' (preparing for completion)
    const canUpload = isAssignee && task.status === 'In Progress';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {/* Header Section */}
                        <h3 className="text-xl font-bold leading-6 text-gray-900 mb-4">{task.title}</h3>

                        {!isAssignee && !isAdminOrManager && (
                            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            You are viewing this task as a read-only observer. Only the assignee can update the status. <br />
                                            <span className="text-xs text-yellow-600 mt-1 block">
                                                (Your ID: {currentUser?.id?.substring(0, 6)}... vs Assignee ID: {task.assignee_id?.substring(0, 6)}...)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2">
                                <span>Start</span>
                                <span>Complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${((normalizedStepIndex) / (STEPS.length - 1)) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-center text-sm font-semibold text-blue-600 mt-2">
                                Current Stage: {task.status}
                            </p>
                        </div>

                        {/* Attachments Section */}
                        <div className="mb-6 bg-slate-50 p-4 rounded-lg">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Attachments</h4>

                            {attachments.length > 0 ? (
                                <ul className="space-y-2 mb-4">
                                    {attachments.map(att => (
                                        <li key={att.id} className="flex justify-between items-center text-sm">
                                            <a
                                                href={attachmentsService.getPublicUrl(att.file_path)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline truncate max-w-[200px]"
                                            >
                                                {att.file_name}
                                            </a>
                                            <span className="text-gray-400 text-xs">{(att.file_size / 1024).toFixed(0)}KB</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 italic mb-3">No attachments yet.</p>
                            )}

                            {/* Upload Input - Visibility Restricted */}
                            {canUpload && (
                                <div className="mt-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Upload New (Images/Office, Max 10MB)</label>
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                                    />
                                    {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 p-3 rounded-md mb-4 text-sm text-slate-600">
                            <p><strong>Description:</strong></p>
                            <p>{task.description || 'No description provided.'}</p>
                        </div>

                        {/* Task Log Timeline */}
                        <div className="bg-white border border-slate-200 p-4 rounded-lg mb-4 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Task Timeline</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Created:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(task.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Deadline:</span>
                                    <span className={`font-medium ${task.deadline && new Date(task.deadline) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                                        {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}
                                    </span>
                                </div>
                                {task.acknowledged_at && (
                                    <div className="flex justify-between">
                                        <span className="text-blue-600">Acknowledged:</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(task.acknowledged_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {task.completed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-green-600">Completed:</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(task.completed_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        {/* Lock Message */}
                        {isLockedForAssignee && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-sm mb-4">
                                🔒 This task is awaiting approval. You cannot make further changes.
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
                        {/* LEFT: Secondary Actions (Close, Reassign) */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="w-full sm:w-auto"
                            >
                                Close
                            </Button>

                            {/* Reassignment UI */}
                            {isAdminOrManager && (
                                <div className="w-full sm:w-auto">
                                    {isReassigning ? (
                                        <div className="flex items-center gap-2">
                                            <select
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5"
                                                onChange={(e) => handleReassign(e.target.value)}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Reassign to...</option>
                                                {teamMembers.map(member => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.full_name || 'Unknown Helper'}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button variant="ghost" size="sm" onClick={() => setIsReassigning(false)}>✕</Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setIsReassigning(true)}
                                            className="w-full sm:w-auto text-slate-500 hover:text-blue-600"
                                        >
                                            Reassign
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Primary Actions (Approve, Reject, Next) */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto sm:justify-end">
                            {/* Approval Flow */}
                            {canApprove && (
                                <>
                                    <Button
                                        onClick={() => handleAction('In Progress')} // Reject -> Send back
                                        disabled={loading}
                                        variant="danger"
                                        className="w-full sm:w-auto bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleAction('Completed')}
                                        disabled={loading}
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 border-transparent text-white"
                                    >
                                        Approve & Complete
                                    </Button>
                                </>
                            )}

                            {/* Standard Workflow */}
                            {canMoveForward && (
                                <Button
                                    onClick={() => handleAction()}
                                    disabled={loading}
                                    className="w-full sm:w-auto shadow-md"
                                >
                                    {loading ? 'Updating...' : getActionLabel()}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskActionModal;
