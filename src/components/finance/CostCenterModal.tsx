import React, { useState, useEffect } from 'react';
import type { CostCenter } from '../../types';
import Button from '../ui/Button';

interface CostCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<CostCenter, 'id' | 'created_at'>) => Promise<void>;
    costCenterToEdit?: CostCenter;
    isProcessing: boolean;
}

const CostCenterModal: React.FC<CostCenterModalProps> = ({
    isOpen,
    onClose,
    onSave,
    costCenterToEdit,
    isProcessing
}) => {
    const [formData, setFormData] = useState({
        type: 'Child' as 'Parent' | 'Child',
        code: '',
        title: '',
        description: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (costCenterToEdit) {
                setFormData({
                    type: costCenterToEdit.type,
                    code: costCenterToEdit.code,
                    title: costCenterToEdit.title,
                    description: costCenterToEdit.description || ''
                });
            } else {
                setFormData({
                    type: 'Child',
                    code: '',
                    title: '',
                    description: ''
                });
            }
        }
    }, [costCenterToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                        {costCenterToEdit ? 'Edit Cost Center' : 'Add Cost Center'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            title="Cost Center Type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Parent' | 'Child' })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            disabled={!!costCenterToEdit} // Generally changing type of existing record is risky
                        >
                            <option value="Parent">Parent</option>
                            <option value="Child">Child</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost Center Code</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="e.g. 3001 or EVT-1001"
                            disabled={!!costCenterToEdit} // Code usually shouldn't change
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title of Code</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="e.g. Travel & Expenses"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            placeholder="Details about this cost center..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={isProcessing}>
                            {isProcessing ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CostCenterModal;
