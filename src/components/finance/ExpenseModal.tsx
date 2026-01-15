import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { type Expense, type ExpenseType, type ExpenseStatus, type CostCenter } from '../../types';
import { financeService } from '../../services/finance';
import { costCenterService } from '../../services/costCenters';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    expenseToEdit?: Expense;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, onClose, onSuccess, expenseToEdit }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        title: string;
        amount: string;
        type: ExpenseType;
        vendor: string;
        cheque_number: string;
        cheque_date: string;
        status: ExpenseStatus;
        parent_cost_center_id: string;
        child_cost_center_id: string;
    }>({
        title: '',
        amount: '',
        type: 'Cash',
        vendor: '',
        cheque_number: '',
        cheque_date: '',
        status: 'Pending',
        parent_cost_center_id: '',
        child_cost_center_id: ''
    });

    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const parentCostCenters = costCenters.filter(c => c.type === 'Parent');
    const childCostCenters = costCenters.filter(c => c.type === 'Child');

    useEffect(() => {
        costCenterService.getCostCenters().then(data => setCostCenters(data)).catch(console.error);
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (expenseToEdit) {
                setFormData({
                    title: expenseToEdit.title,
                    amount: expenseToEdit.amount.toString(),
                    type: expenseToEdit.type,
                    vendor: expenseToEdit.vendor || '',
                    cheque_number: expenseToEdit.cheque_number || '',
                    cheque_date: expenseToEdit.cheque_date ? new Date(expenseToEdit.cheque_date).toISOString().split('T')[0] : '',
                    status: expenseToEdit.status,
                    parent_cost_center_id: expenseToEdit.parent_cost_center_id || '',
                    child_cost_center_id: expenseToEdit.child_cost_center_id || ''
                });
            } else {
                setFormData({
                    title: '',
                    amount: '',
                    type: 'Cash',
                    vendor: '',
                    cheque_number: '',
                    cheque_date: '',
                    status: 'Pending',
                    parent_cost_center_id: '',
                    child_cost_center_id: ''
                });
            }
            setError(null);
        }
    }, [isOpen, expenseToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const payload: Partial<Expense> = {
                title: formData.title,
                amount: parseFloat(formData.amount),
                type: formData.type,
                vendor: formData.vendor || null,
                status: formData.status,
                // Only include cheque details if type is Cheque
                // Only include cheque details if type is Cheque
                cheque_number: formData.type === 'Cheque' ? formData.cheque_number : null,
                cheque_date: formData.type === 'Cheque' && formData.cheque_date ? formData.cheque_date : null,
                parent_cost_center_id: formData.parent_cost_center_id || null,
                child_cost_center_id: formData.child_cost_center_id || null
            };

            if (expenseToEdit) {
                await financeService.updateExpense(expenseToEdit.id, payload);
            } else {
                await financeService.createExpense(payload);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving expense:', err);
            setError(err.message || 'Failed to save expense');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                {expenseToEdit ? 'Edit Transaction' : 'New Transaction'}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Record a payment, expense, or cheque entry.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title / Description</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (SAR)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ExpenseType })}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Transfer">Bank Transfer</option>
                                    <option value="Card">Credit/Debit Card</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vendor / Payee</label>
                            <input
                                type="text"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.vendor}
                                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Cost Center</label>
                                <select
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.parent_cost_center_id}
                                    title="Parent Cost Center"
                                    onChange={(e) => setFormData({ ...formData, parent_cost_center_id: e.target.value })}
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
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.child_cost_center_id}
                                    title="Child Cost Center"
                                    onChange={(e) => setFormData({ ...formData, child_cost_center_id: e.target.value })}
                                >
                                    <option value="">Select Child...</option>
                                    {childCostCenters.map(cc => (
                                        <option key={cc.id} value={cc.id}>{cc.code} - {cc.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {formData.type === 'Cheque' && (
                            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-yellow-800 uppercase">Cheque Number</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border-yellow-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                                        value={formData.cheque_number}
                                        onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-yellow-800 uppercase">Cheque Date</label>
                                    <input
                                        type="date"
                                        className="mt-1 block w-full border-yellow-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                                        value={formData.cheque_date}
                                        onChange={(e) => setFormData({ ...formData, cheque_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as ExpenseStatus })}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Cleared">Cleared</option>
                                <option value="Bounce">Bounce</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full sm:col-start-2"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Transaction'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                className="mt-3 w-full sm:mt-0 sm:col-start-1"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExpenseModal;
