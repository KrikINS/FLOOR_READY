import React, { useState, useEffect } from 'react';
import { costCenterService } from '../../services/costCenters';
import { useAuth } from '../../context/AuthContext';
import type { CostCenter } from '../../types';
import Button from '../ui/Button';
import CostCenterModal from './CostCenterModal';

const CostCentersTab: React.FC = () => {
    const { profile: currentUser } = useAuth();
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CostCenter | undefined>(undefined);
    const [processing, setProcessing] = useState(false);

    const canAdd = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';
    const canEdit = currentUser?.role === 'Admin';
    const canDelete = currentUser?.role === 'Admin';

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await costCenterService.getCostCenters();
            setCostCenters(data);
        } catch (error) {
            console.error('Error loading cost centers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAdd = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (item: CostCenter) => {
        if (!canEdit) return;
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!canDelete || !confirm('Are you sure you want to delete this Cost Center?')) return;
        try {
            await costCenterService.deleteCostCenter(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete cost center.');
        }
    };

    const handleSave = async (data: Omit<CostCenter, 'id' | 'created_at'>) => {
        setProcessing(true);
        try {
            if (editingItem) {
                await costCenterService.updateCostCenter(editingItem.id, data);
            } else {
                await costCenterService.createCostCenter(data);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save cost center.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Cost Centers Master List</h3>
                    <p className="mt-1 text-sm text-gray-500">Manage Parent and Child Cost Centers.</p>
                </div>
                {canAdd && (
                    <Button variant="primary" onClick={handleAdd}>
                        + Add Cost Center
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Center Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {costCenters.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                        ${item.type === 'Parent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                    {item.code}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {item.title}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-pre-wrap">
                                    {item.description}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {canEdit && (
                                        <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                    )}
                                    {canDelete && (
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {costCenters.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No Cost Centers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CostCenterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                costCenterToEdit={editingItem}
                isProcessing={processing}
            />
        </div>
    );
};

export default CostCentersTab;
