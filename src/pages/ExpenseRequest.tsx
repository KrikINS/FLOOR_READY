import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { expenseRequestService } from '../services/expenseRequests';
import { tasksService } from '../services/tasks';
import { costCenterService } from '../services/costCenters';
import type { ExpenseRequest, Task, CostCenter, Profile } from '../types';
import Button from '../components/ui/Button';

// Simple Form Component
const ExpenseRequestForm: React.FC<{
    onClose: () => void;
    onSuccess: () => void;
    currentUser: Profile | null
}> = ({ onClose, onSuccess, currentUser }) => {
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [formData, setFormData] = useState({
        request_date: new Date().toISOString().split('T')[0],
        type: 'Task' as 'Task' | 'Miscellaneous',
        task_id: '',
        amount: '',
        description: '',
        requester_comments: '',
        attachment_url: '', // Placeholder mostly
        parent_cost_center_id: '',
        child_cost_center_id: ''
    });

    const parentCostCenters = costCenters.filter(c => c.type === 'Parent');
    const childCostCenters = costCenters.filter(c => c.type === 'Child');

    useEffect(() => {
        // Fetch tasks and cost centers
        const loadData = async () => {
            try {
                const [tasksData, costCentersData] = await Promise.all([
                    tasksService.getTasks(),
                    costCenterService.getCostCenters()
                ]);
                setTasks(tasksData.filter(t => t.status !== 'Completed'));
                setCostCenters(costCentersData);
            } catch (err) {
                console.error("Failed to load data", err);
            }
        };
        loadData();
    }, []);

    // Auto-select Parent Cost Center when Task is Selected
    useEffect(() => {
        if (formData.task_id) {
            const task = tasks.find(t => t.id === formData.task_id);
            if (task && task.events?.cost_center_code) {
                const parentCC = costCenters.find(c => c.code === task.events?.cost_center_code && c.type === 'Parent');
                if (parentCC) {
                    setFormData(prev => ({ ...prev, parent_cost_center_id: parentCC.id }));
                }
            }
        }
    }, [formData.task_id, tasks, costCenters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);
        try {
            await expenseRequestService.createRequest({
                requester_id: currentUser.id,
                request_date: formData.request_date,
                type: formData.type,
                task_id: formData.type === 'Task' && formData.task_id ? formData.task_id : null,
                amount: parseFloat(formData.amount),
                description: formData.description,
                requester_comments: formData.requester_comments,
                status: 'Pending',
                parent_cost_center_id: formData.parent_cost_center_id || null,
                child_cost_center_id: formData.child_cost_center_id || null
            });
            onSuccess();
        } catch (error) {
            console.error('Failed to submit request:', error);
            alert('Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">New Expense Request</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Requester</label>
                        <input type="text" disabled value={currentUser?.full_name || currentUser?.email || ''} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm" title="Requester Name" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            required
                            title="Request Date"
                            value={formData.request_date}
                            onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <div className="mt-2 flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-indigo-600"
                                    name="type"
                                    value="Task"
                                    title="Task Related Expense"
                                    checked={formData.type === 'Task'}
                                    onChange={() => setFormData({ ...formData, type: 'Task' })}
                                />
                                <span className="ml-2">Task Related</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio text-indigo-600"
                                    name="type"
                                    value="Miscellaneous"
                                    title="Miscellaneous Expense"
                                    checked={formData.type === 'Miscellaneous'}
                                    onChange={() => setFormData({ ...formData, type: 'Miscellaneous' })}
                                />
                                <span className="ml-2">Miscellaneous</span>
                            </label>
                        </div>
                    </div>

                    {formData.type === 'Task' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Select Task</label>
                            <select
                                required
                                value={formData.task_id}
                                title="Select Task"
                                onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Select a task...</option>
                                {tasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.title} ({t.events?.name})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Parent Cost Center</label>
                            <select
                                required
                                value={formData.parent_cost_center_id}
                                title="Parent Cost Center"
                                onChange={(e) => setFormData({ ...formData, parent_cost_center_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Select Parent...</option>
                                {parentCostCenters.map(cc => (
                                    <option key={cc.id} value={cc.id}>{cc.code} - {cc.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Child Cost Center</label>
                            <select
                                required
                                value={formData.child_cost_center_id}
                                title="Child Cost Center"
                                onChange={(e) => setFormData({ ...formData, child_cost_center_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="">Select Child...</option>
                                {childCostCenters.map(cc => (
                                    <option key={cc.id} value={cc.id}>{cc.code} - {cc.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount (SAR)</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            min="0"
                            placeholder="0.00"
                            title="Expense Amount"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description / Details</label>
                        <textarea
                            required
                            rows={3}
                            title="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Comments (Optional)</label>
                        <textarea
                            rows={2}
                            title="Comments"
                            value={formData.requester_comments}
                            onChange={(e) => setFormData({ ...formData, requester_comments: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                    {/* Placeholder for file upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Attachments (Optional)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" disabled />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB (Coming Soon)</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </div >
        </div >
    );
};

const ExpenseRequestPage: React.FC = () => {
    const { profile: currentUser } = useAuth();
    const [requests, setRequests] = useState<ExpenseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'my_requests' | 'approvals'>('my_requests');

    // Role check
    const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

    const loadRequests = async () => {
        try {
            setLoading(true);
            const data = await expenseRequestService.getRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    // Effect to switch tab if user is not admin
    useEffect(() => {
        if (!isAdminOrManager && activeTab === 'approvals') {
            setActiveTab('my_requests');
        }
    }, [isAdminOrManager, activeTab]);

    const handleAction = async (id: string, action: 'Approve' | 'Reject' | 'Confirm' | 'Delete') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            if (action === 'Approve') {
                await expenseRequestService.updateStatus(id, 'Approved');
            } else if (action === 'Reject') {
                const reason = prompt('Please provide a rejection reason:');
                if (reason === null) return; // Cancelled
                await expenseRequestService.updateStatus(id, 'Rejected', reason);
            } else if (action === 'Confirm') { // User confirming receipt
                await expenseRequestService.updateStatus(id, 'Paid_Confirmed');
            }
            loadRequests();
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
            alert(`Failed to ${action} request.`);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'my_requests') {
            return req.requester_id === currentUser?.id;
        } else {
            // Approvals tab: Show pending requests from OTHERS (and maybe approved ones for history)
            // Admins probably want to see everything.
            // Let's filter to Pending/Changes_Requested for actioning, or show all for oversight.
            // Following requirement: "Approvals" implied action items.
            return req.status === 'Pending' || req.status === 'Changes_Requested';
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Approved': return 'bg-blue-100 text-blue-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Paid_Confirmed': return 'bg-green-100 text-green-800';
            case 'Changes_Requested': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-full flex-col">
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Expense Requests</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage and submit expense reimbursement requests.
                            </p>
                        </div>
                        <Button variant="primary" onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                            + New Request
                        </Button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('my_requests')}
                                className={`${activeTab === 'my_requests'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                My Requests
                            </button>
                            {isAdminOrManager && (
                                <button
                                    onClick={() => setActiveTab('approvals')}
                                    className={`${activeTab === 'approvals'
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Approvals
                                    {/* Badge count could go here */}
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Request List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type / Task</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredRequests.map((req) => (
                                            <tr key={req.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(req.request_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    <div className="flex items-center">
                                                        {req.profiles?.avatar_url && (
                                                            <img src={req.profiles.avatar_url} alt="" className="h-6 w-6 rounded-full mr-2" />
                                                        )}
                                                        {req.profiles?.full_name || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    <div className="font-medium text-gray-900">{req.type}</div>
                                                    {req.tasks?.title && <div className="text-xs text-gray-400">{req.tasks.title}</div>}
                                                    {req.description && <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{req.description}</div>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    SAR {req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                    {req.rejection_reason && (
                                                        <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={req.rejection_reason}>
                                                            Reason: {req.rejection_reason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {/* Actions based on Tab/Role */}
                                                    {activeTab === 'approvals' && isAdminOrManager && req.status === 'Pending' && (
                                                        <div className="space-x-2">
                                                            <button onClick={() => handleAction(req.id, 'Approve')} className="text-green-600 hover:text-green-900">Approve</button>
                                                            <button onClick={() => handleAction(req.id, 'Reject')} className="text-red-600 hover:text-red-900">Reject</button>
                                                        </div>
                                                    )}

                                                    {/* User Actions */}
                                                    {activeTab === 'my_requests' && req.status === 'Approved' && (
                                                        <button onClick={() => handleAction(req.id, 'Confirm')} className="text-indigo-600 hover:text-indigo-900">Confirm Receipt</button>
                                                    )}

                                                    {/* Resubmit logic could go here (opening modal with edit mode) - Skipping complex edit for MVP, user can delete/create new or we add 'resubmit' which just changes status locally? */}
                                                    {activeTab === 'my_requests' && req.status === 'Rejected' && (
                                                        <span className="text-gray-400 italic">Rejected</span>
                                                        // <button className="text-indigo-600 hover:text-indigo-900 ml-2">Edit</button> // TODO
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRequests.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No requests found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isFormOpen && currentUser && (
                <ExpenseRequestForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        loadRequests();
                    }}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default ExpenseRequestPage;
