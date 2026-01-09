import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryService } from '../../services/inventory';
import Button from '../../components/ui/Button';

const NewItem: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        item_name: '',
        category: '',
        current_stock: 0,
        min_stock_level: 5,
        image_url: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await inventoryService.addItem({
                ...formData,
                supplier_info: {}, // Placeholder
            });
            navigate('/inventory');
        } catch (error) {
            console.error('Error creating item:', error);
            alert('Failed to create inventory item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">Add Inventory Item</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Item Name</label>
                    <input
                        type="text"
                        name="item_name"
                        required
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                        value={formData.item_name}
                        onChange={handleChange}
                        title="Name of the inventory item"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Category</label>
                    <input
                        type="text"
                        name="category"
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                        value={formData.category}
                        onChange={handleChange}
                        placeholder="e.g. Electronics, Furniture"
                        title="Category of the item"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Initial Stock</label>
                        <input
                            type="number"
                            name="current_stock"
                            min="0"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            value={formData.current_stock}
                            onChange={handleChange}
                            title="Initial stock count"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Min. Stock Level</label>
                        <input
                            type="number"
                            name="min_stock_level"
                            min="0"
                            required
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            value={formData.min_stock_level}
                            onChange={handleChange}
                            title="Stock level at which to warn"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Image URL</label>
                    <input
                        type="url"
                        name="image_url"
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                        value={formData.image_url}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        title="URL of the item image"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('/inventory')}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Create Item
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default NewItem;
