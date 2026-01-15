import React, { useState, useEffect } from 'react';
import type { Task, CostCenter } from '../../types';
import { costCenterService } from '../../services/costCenters';
import Button from '../ui/Button';

interface ProfitabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<Task>) => Promise<void>;
    task: Task;
}

const ProfitabilityModal: React.FC<ProfitabilityModalProps> = ({
    isOpen,
    onClose,
    onSave,
    task
}) => {
    const [loading, setLoading] = useState(false);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [formData, setFormData] = useState({
        cost_to_client: '',
        unit_type: '',
        billable_quantity: '',
        profitability_comments: '',
        cost_center_id: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                cost_to_client: task.cost_to_client?.toString() || '',
                unit_type: task.unit_type || '',
                billable_quantity: task.billable_quantity?.toString() || '',
                profitability_comments: task.profitability_comments || '',
                cost_center_id: task.cost_center_id || ''
            });
            fetchCostCenters();
        }
    }, [isOpen, task]);

    const fetchCostCenters = async () => {
        try {
            const data = await costCenterService.getCostCenters();
            setCostCenters(data);
        } catch (err) {
            console.error('Failed to load cost centers', err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                cost_to_client: formData.cost_to_client ? parseFloat(formData.cost_to_client) : null,
                unit_type: formData.unit_type || null,
                billable_quantity: formData.billable_quantity ? parseFloat(formData.billable_quantity) : null,
                profitability_comments: formData.profitability_comments || null,
                cost_center_id: formData.cost_center_id || null
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save profitability details');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Profitability Analysis</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">×</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="cost_center_id">Cost Center</label>
                        <select
                            id="cost_center_id"
                            name="cost_center_id"
                            title="Cost Center"
                            value={formData.cost_center_id}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        >
                            <option value="">Select a Cost Center</option>
                            {costCenters.map(cc => (
                                <option key={cc.id} value={cc.id}>
                                    {cc.code} - {cc.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="cost_to_client">Cost to Client</label>
                            <input
                                id="cost_to_client"
                                type="number"
                                name="cost_to_client"
                                title="Cost to Client"
                                step="0.01"
                                value={formData.cost_to_client}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700" htmlFor="unit_type">Unit Type</label>
                            <input
                                id="unit_type"
                                type="text"
                                name="unit_type"
                                title="Unit Type"
                                placeholder="e.g. Hour, Piece"
                                value={formData.unit_type}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="billable_quantity">Billable Quantity</label>
                        <input
                            id="billable_quantity"
                            type="number"
                            name="billable_quantity"
                            title="Billable Quantity"
                            step="0.01"
                            value={formData.billable_quantity}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="profitability_comments">Comments</label>
                        <textarea
                            id="profitability_comments"
                            name="profitability_comments"
                            title="Profitability Comments"
                            rows={3}
                            value={formData.profitability_comments}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                        <Button variant="primary" type="submit" isLoading={loading}>Save</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfitabilityModal;
