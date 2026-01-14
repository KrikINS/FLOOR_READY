import React, { useState, useEffect, useCallback } from 'react';
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

    // Fulfillment State
    const [fulfillmentData, setFulfillmentData] = useState({
        actual_cost: task.actual_cost?.toString() || '',
        vendor_name: task.vendor_name || '',
        vendor_address: task.vendor_address || '',
        vendor_contact: task.vendor_contact || '',
    });

    // Permission Logic
    const isAssignee = currentUser?.id === task.assignee_id;
    const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
    const canEditFulfillment = isAssignee || isAdminOrManager;

    const currentStepIndex = STEPS.indexOf(task.status);
    // Handle case where existing task might be 'In Review' (treat as Acknowledged index for visual progress)
    const normalizedStepIndex = task.status === 'In Review' ? STEPS.indexOf('Acknowledged') : currentStepIndex;
    const nextStep = STEPS[normalizedStepIndex + 1];

    // Lock and Check logic
    const isLockedForAssignee = isAssignee && task.status === 'Awaiting Approval';
    const canApprove = isAdminOrManager && task.status === 'Awaiting Approval';
    const canMoveForward = isAssignee && !isLockedForAssignee && nextStep;

    const loadAttachments = useCallback(async () => {
        try {
            const data = await attachmentsService.getAttachments(task.id);
            setAttachments(data);
        } catch (err) {
            console.error('Failed to load attachments', err);
        }
    }, [task.id]);

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
            // Reset fulfillment state on open
            setFulfillmentData({
                actual_cost: task.actual_cost?.toString() || '',
                vendor_name: task.vendor_name || '',
                vendor_address: task.vendor_address || '',
                vendor_contact: task.vendor_contact || '',
            });
        }
    }, [isOpen, loadAttachments, isAdminOrManager, task.actual_cost, task.vendor_name, task.vendor_address, task.vendor_contact]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser) return;

        setUploading(true);
        setError(null);
        try {
            const context = task.status === 'In Progress' ? 'submission' : 'comment';
            await attachmentsService.uploadAttachment(file, task.id, currentUser.id, context);
            await loadAttachments();
        } catch (err: unknown) {
            console.error('Upload failed:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    // Save Fulfillment info separately or with status change?
    // Let's create a specific handler for saving details
    const handleSaveFulfillment = async () => {
        setLoading(true);
        try {
            await tasksService.updateTask(task.id, {
                actual_cost: fulfillmentData.actual_cost ? Number(fulfillmentData.actual_cost) : null,
                vendor_name: fulfillmentData.vendor_name,
                vendor_address: fulfillmentData.vendor_address,
                vendor_contact: fulfillmentData.vendor_contact,
            });
            onTaskUpdated(); // Refresh parent
        } catch (err: unknown) {
            console.error('Failed to save details:', err);
            setError(err instanceof Error ? err.message : 'Failed to save details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleAction = async (targetStatus?: TaskStatus) => {
        const statusToSet = targetStatus || nextStep;

        // Auto-save details if moving to 'Completed' or 'Awaiting Approval' and they are filled?
        // For now, let's just save the status. Ideally we valid fields here.
        if ((statusToSet === 'Completed' || statusToSet === 'Awaiting Approval') && (!fulfillmentData.actual_cost && !fulfillmentData.vendor_name)) {
            // Optional: warn user? For now let's allow it but we could enforce it.
        }
        if (!statusToSet) return;
        const validStatus = statusToSet; // Capture for type safety

        setLoading(true);
        setError(null);

        try {
            const updates: Partial<Task> = { status: validStatus };
            const now = new Date().toISOString();

            if (validStatus === 'Acknowledged') {
                updates.acknowledged_at = now;
            } else if (validStatus === 'In Progress') {
                updates.started_at = now;
            } else if (validStatus === 'Completed') {
                updates.completed_at = now;
            }

            // Merge fulfillment data into updates
            Object.assign(updates, {
                actual_cost: fulfillmentData.actual_cost ? Number(fulfillmentData.actual_cost) : null,
                vendor_name: fulfillmentData.vendor_name,
                vendor_address: fulfillmentData.vendor_address,
                vendor_contact: fulfillmentData.vendor_contact,
            });

            await tasksService.updateTask(task.id, updates);
            onTaskUpdated();
            onClose();
        } catch (err: unknown) {
            console.error('Failed to update task:', err);
            setError(err instanceof Error ? err.message : 'Failed to update task status');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) return;

        setLoading(true);
        try {
            await tasksService.deleteTask(task.id);
            onTaskUpdated();
            onClose();
        } catch (err: unknown) {
            console.error('Failed to delete task:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete task');
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
        } catch (err: unknown) {
            console.error('Failed to reassign:', err);
            setError(err instanceof Error ? err.message : 'Failed to reassign');
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
                                    <label htmlFor="task-attachment-upload" className="block text-xs font-medium text-gray-700 mb-1">Upload New (Images/Office, Max 10MB)</label>
                                    <input
                                        id="task-attachment-upload"
                                        title="Upload attachment"
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

                        {/* Fulfillment Details Section - Hidden in early stages */}
                        {!['Pending', 'Acknowledged'].includes(task.status) && (
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">Fulfillment Details</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Cost */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 uppercase">Actual Cost (SAR)</label>
                                        <input
                                            type="number"
                                            disabled={!canEditFulfillment}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                            placeholder="0.00"
                                            value={fulfillmentData.actual_cost}
                                            onChange={(e) => setFulfillmentData({ ...fulfillmentData, actual_cost: e.target.value })}
                                        />
                                    </div>

                                    {/* Vendor Name */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 uppercase">Vendor / Service Provider Name</label>
                                        <input
                                            type="text"
                                            disabled={!canEditFulfillment}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                            placeholder="Company Name"
                                            value={fulfillmentData.vendor_name}
                                            onChange={(e) => setFulfillmentData({ ...fulfillmentData, vendor_name: e.target.value })}
                                        />
                                    </div>

                                    {/* Vendor Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 uppercase">Vendor Contact</label>
                                            <input
                                                type="text"
                                                disabled={!canEditFulfillment}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                                placeholder="+971..."
                                                value={fulfillmentData.vendor_contact}
                                                onChange={(e) => setFulfillmentData({ ...fulfillmentData, vendor_contact: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 uppercase">Address / Location</label>
                                            <input
                                                type="text"
                                                disabled={!canEditFulfillment}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                                placeholder="Location"
                                                value={fulfillmentData.vendor_address}
                                                onChange={(e) => setFulfillmentData({ ...fulfillmentData, vendor_address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Save Button for Fulfillment */}
                                    {canEditFulfillment && (
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleSaveFulfillment}
                                                isLoading={loading}
                                            >
                                                Save Details
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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
                                {task.started_at && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Started:</span>
                                        <span className="font-medium text-gray-900">
                                            {new Date(task.started_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}
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
                                        <span className="font-medium text-green-600">
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
                                                title="Reassign to team member"
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

                                    {/* Delete Button */}
                                    <Button
                                        variant="ghost"
                                        onClick={handleDelete}
                                        className="w-full sm:w-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                                        title="Delete Task"
                                    >
                                        Delete
                                    </Button>
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
            </div >
        </div >
    );
};

export default TaskActionModal;
