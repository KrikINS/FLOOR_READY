import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../../services/inventory';
import type { InventoryItem } from '../../types';
import InventoryCard from '../../components/inventory/InventoryCard';
import Button from '../../components/ui/Button';

const InventoryList: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const data = await inventoryService.getInventory();
            setItems(data);
        } catch (err) {
            setError('Failed to load inventory.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (id: string, newStock: number) => {
        try {
            await inventoryService.updateStock(id, newStock);
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, current_stock: newStock } : item
            ));
        } catch (err) {
            console.error('Failed to update stock', err);
            alert('Failed to update stock');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage stock levels and supplies.
                    </p>
                </div>
                <Link to="/inventory/new">
                    <Button>Add Item</Button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}

            {items.length === 0 && !error ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-slate-500">No inventory items found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((item) => (
                        <InventoryCard
                            key={item.id}
                            item={item}
                            onUpdateStock={handleUpdateStock}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryList;
