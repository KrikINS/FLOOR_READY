import React, { useState } from 'react';
import type { InventoryItem } from '../../types';
import StockBadge from './StockBadge';
import Button from '../ui/Button';

interface InventoryCardProps {
    item: InventoryItem;
    onUpdateStock: (id: string, newStock: number) => void;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item, onUpdateStock }) => {
    const [updating, setUpdating] = useState(false);

    const handleAdjust = async (amount: number) => {
        setUpdating(true);
        const newStock = Math.max(0, item.current_stock + amount);
        await onUpdateStock(item.id, newStock);
        setUpdating(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="h-48 w-full bg-slate-100 relative">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.item_name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <StockBadge current={item.current_stock} min={item.min_stock_level} />
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-slate-900">{item.item_name}</h3>
                    {item.category && <p className="text-sm text-slate-500">{item.category}</p>}

                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Stock: {item.current_stock}</span>
                        <span className="text-xs text-slate-400">Min: {item.min_stock_level}</span>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-4 border-slate-100">
                    <span className="text-sm text-slate-500">Adjust:</span>
                    <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" onClick={() => handleAdjust(-1)} disabled={updating || item.current_stock <= 0}>-</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleAdjust(1)} disabled={updating}>+</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryCard;
