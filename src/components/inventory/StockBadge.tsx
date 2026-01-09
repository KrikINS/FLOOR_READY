import React from 'react';
import Badge from '../ui/Badge';

interface StockBadgeProps {
    current: number;
    min: number;
}

const StockBadge: React.FC<StockBadgeProps> = ({ current, min }) => {
    if (current <= 0) {
        return <Badge variant="error">Out of Stock</Badge>;
    }
    if (current <= min) {
        return <Badge variant="warning">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
};

export default StockBadge;
