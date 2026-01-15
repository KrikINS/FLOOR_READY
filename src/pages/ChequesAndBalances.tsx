import React, { useState, useEffect, useCallback } from 'react';
import { financeService } from '../services/finance';
import { tasksService } from '../services/tasks';
import { useAuth } from '../context/AuthContext';
import type { Expense, Task } from '../types';
import Button from '../components/ui/Button';
import ExpenseModal from '../components/finance/ExpenseModal';

import CostCentersTab from '../components/finance/CostCentersTab';

const ChequesAndBalances: React.FC = () => {
    const { profile: currentUser } = useAuth();
    const isAdminOrManager = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

    const [activeTab, setActiveTab] = useState<'expenses' | 'profitability' | 'cost_centers'>('expenses');

    // Expenses State
    const [expenses, setExpenses] = useState<(Expense & { tasks?: { title: string } })[]>([]);

    // Profitability State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [editingRows, setEditingRows] = useState<{ [key: string]: Partial<Task> }>({});

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOutstanding: 0,
        totalCleared: 0,
        pendingCheques: 0
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(undefined);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);

            if (activeTab === 'expenses') {
                const data = await financeService.getExpenses();
                setExpenses(data);
                calculateStats(data);
            } else if (activeTab === 'profitability') {
                if (!isAdminOrManager) return; // Skip if no access
                const tasksData = await tasksService.getTasks();
                setTasks(tasksData);
            }
            // cost_centers loads its own data
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, isAdminOrManager]);

    useEffect(() => {
        loadData();
    }, [loadData]); // Reload when tab switches to ensure fresh data

    const calculateStats = (data: Expense[]) => {
        const pending = data.filter(e => e.status === 'Pending');
        const cleared = data.filter(e => e.status === 'Cleared');

        setStats({
            totalOutstanding: pending.reduce((sum, e) => sum + Number(e.amount), 0),
            totalCleared: cleared.reduce((sum, e) => sum + Number(e.amount), 0),
            pendingCheques: pending.filter(e => e.type === 'Cheque').length
        });
    };

    // --- Expense Handlers ---
    const handleAdd = () => {
        setSelectedExpense(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
    };

    // --- Profitability Handlers ---
    const getSrNo = (task: Task) => {
        // Initials + 4 digit ID suffix (or sequential if we had a proper index, using ID slice for now as requested format)
        // Ideally "TE0001". Let's try to construct something meaningful.
        const initials = task.events?.name
            ? task.events.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'TS'; // Task

        // Use last 4 of ID as unique reliable number for now
        const suffix = task.id.substring(0, 4).toUpperCase();
        return `${initials}${suffix}`;
    };

    const handleCellChange = (taskId: string, field: keyof Task, value: string | number) => {
        setEditingRows(prev => ({
            ...prev,
            [taskId]: {
                ...prev[taskId],
                [field]: value
            }
        }));
    };

    const saveRow = async (taskId: string) => {
        const updates = editingRows[taskId];
        if (!updates) return;

        try {
            await tasksService.updateTask(taskId, updates);
            // Update local state
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
            // Clear edit state for this row
            const newEditing = { ...editingRows };
            delete newEditing[taskId];
            setEditingRows(newEditing);
        } catch (error) {
            console.error('Failed to save task updates:', error);
            alert('Failed to save changes.');
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-full flex-col">
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">Cheques & Balances</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Financial tracking and profitability analysis.
                            </p>
                        </div>
                        {activeTab === 'expenses' && (
                            <Button variant="primary" onClick={handleAdd} className="w-full sm:w-auto">
                                + Add Expense
                            </Button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                        <nav className="-mb-px flex space-x-8 min-w-max">
                            <button
                                onClick={() => setActiveTab('expenses')}
                                className={`${activeTab === 'expenses'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Expenses
                            </button>
                            <button
                                onClick={() => setActiveTab('profitability')}
                                className={`${activeTab === 'profitability'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Task Profitability Analysis
                            </button>
                            <button
                                onClick={() => setActiveTab('cost_centers')}
                                className={`${activeTab === 'cost_centers'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                Cost Centers
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 pb-20">
                    {loading && activeTab !== 'cost_centers' ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'expenses' && (
                                <>
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                                        <div className="bg-white overflow-hidden shadow rounded-lg">
                                            <div className="p-5">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                                                        <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Outstanding</dt>
                                                            <dd className="text-lg font-medium text-gray-900">SAR {stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white overflow-hidden shadow rounded-lg">
                                            <div className="p-5">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                                                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Cleared</dt>
                                                            <dd className="text-lg font-medium text-gray-900">SAR {stats.totalCleared.toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white overflow-hidden shadow rounded-lg">
                                            <div className="p-5">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-5 w-0 flex-1">
                                                        <dl>
                                                            <dt className="text-sm font-medium text-gray-500 truncate">Pending Cheques</dt>
                                                            <dd className="text-lg font-medium text-gray-900">{stats.pendingCheques}</dd>
                                                        </dl>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expenses Transactions Table */}
                                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                        <div className="px-4 py-5 sm:px-6">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">Transactions</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-[800px] w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Task</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (SAR)</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {expenses.map((expense) => (
                                                        <tr key={expense.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {new Date(expense.created_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                                <div className="font-medium">{expense.title}</div>
                                                                {expense.tasks?.title && (
                                                                    <div className="text-xs text-gray-500">Task: {expense.tasks.title}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {expense.type}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                                    ${expense.status === 'Cleared' ? 'bg-green-100 text-green-800' :
                                                                        expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                            expense.status === 'Bounce' ? 'bg-red-100 text-red-800' :
                                                                                'bg-gray-100 text-gray-800'}`}>
                                                                    {expense.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                SAR {Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button onClick={() => handleEdit(expense)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {expenses.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                                                No transactions found.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <ExpenseModal
                                        isOpen={isModalOpen}
                                        onClose={() => setIsModalOpen(false)}
                                        onSuccess={() => {
                                            setIsModalOpen(false);
                                            loadData();
                                        }}
                                        expenseToEdit={selectedExpense}
                                    />
                                </>
                            )}

                            {activeTab === 'profitability' && (
                                <>
                                    {isAdminOrManager ? (
                                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                                            <div className="px-4 py-5 sm:px-6">
                                                <h3 className="text-lg leading-6 font-medium text-gray-900">Task Profitability Analysis</h3>
                                                <p className="mt-1 text-sm text-gray-500">Analyze task costs vs client charges.</p>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-[1200px] w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Title</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Cost to Client (Unit)</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost (Unit)</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit (Unit)</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Type</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Qty</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-bold">Net Profit</th>
                                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Comments</th>
                                                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {tasks.map((task) => {
                                                            const editData = editingRows[task.id] || {};

                                                            // Values (prefer edit data, fallback to task data)
                                                            const costToClient = editData.cost_to_client !== undefined ? Number(editData.cost_to_client) : (task.cost_to_client || 0);
                                                            const actualCost = task.actual_cost || 0; // Coming from task fulfillment
                                                            const quantity = editData.billable_quantity !== undefined ? Number(editData.billable_quantity) : (task.billable_quantity || 1);
                                                            const unitType = (editData.unit_type !== undefined ? editData.unit_type : task.unit_type) || 'Piece';
                                                            const comments = (editData.profitability_comments !== undefined ? editData.profitability_comments : task.profitability_comments) || '';

                                                            // Calculations
                                                            const profitPerUnit = costToClient - actualCost;
                                                            const netProfit = profitPerUnit * quantity;

                                                            const isEditing = !!editingRows[task.id];

                                                            return (
                                                                <tr key={task.id} className="hover:bg-gray-50 text-sm">
                                                                    <td className="px-3 py-4 whitespace-nowrap font-mono text-gray-500">
                                                                        {getSrNo(task)}
                                                                    </td>
                                                                    <td className="px-3 py-4 font-medium text-gray-900 max-w-xs truncate" title={task.title}>
                                                                        {task.title}
                                                                        <div className="text-xs text-gray-400">{task.events?.name}</div>
                                                                    </td>
                                                                    <td className="px-3 py-4 whitespace-nowrap text-gray-500">
                                                                        <div className="flex items-center">
                                                                            {task.profiles?.avatar_url ? (
                                                                                <img src={task.profiles.avatar_url} alt={task.profiles?.full_name || 'Avatar'} className="h-6 w-6 rounded-full mr-2" />
                                                                            ) : (
                                                                                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs mr-2">{task.profiles?.full_name?.charAt(0)}</div>
                                                                            )}
                                                                            <span className="truncate max-w-[100px]">{task.profiles?.full_name}</span>
                                                                        </div>
                                                                    </td>

                                                                    {/* Cost To Client (Editable) */}
                                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                                        <input
                                                                            type="number"
                                                                            value={costToClient}
                                                                            onChange={(e) => handleCellChange(task.id, 'cost_to_client', parseFloat(e.target.value) || 0)}
                                                                            className="w-24 border-gray-300 rounded-md text-sm p-1 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                            title="Cost to client"
                                                                            aria-label="Cost to client"
                                                                        />
                                                                    </td>

                                                                    <td className="px-3 py-4 whitespace-nowrap text-gray-500">
                                                                        {actualCost.toLocaleString()}
                                                                    </td>

                                                                    <td className={`px-3 py-4 whitespace-nowrap font-medium ${profitPerUnit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                        {profitPerUnit.toLocaleString()}
                                                                    </td>

                                                                    {/* Unit Type (Editable) */}
                                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                                        <input
                                                                            type="text"
                                                                            value={unitType}
                                                                            onChange={(e) => handleCellChange(task.id, 'unit_type', e.target.value)}
                                                                            className="w-20 border-gray-300 rounded-md text-sm p-1 shadow-sm"
                                                                            title="Unit type"
                                                                            aria-label="Unit type"
                                                                        />
                                                                    </td>

                                                                    {/* Quantity (Editable) */}
                                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                                        <input
                                                                            type="number"
                                                                            value={quantity}
                                                                            onChange={(e) => handleCellChange(task.id, 'billable_quantity', parseFloat(e.target.value) || 0)}
                                                                            className="w-16 border-gray-300 rounded-md text-sm p-1 shadow-sm"
                                                                            title="Quantity"
                                                                            aria-label="Quantity"
                                                                        />
                                                                    </td>

                                                                    <td className={`px-3 py-4 whitespace-nowrap font-bold ${netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                        {netProfit.toLocaleString()}
                                                                    </td>

                                                                    {/* Comments (Editable) */}
                                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                                        <input
                                                                            type="text"
                                                                            value={comments}
                                                                            onChange={(e) => handleCellChange(task.id, 'profitability_comments', e.target.value)}
                                                                            className="w-full border-gray-300 rounded-md text-sm p-1 shadow-sm"
                                                                            placeholder="Notes..."
                                                                            title="Comments"
                                                                            aria-label="Comments"
                                                                        />
                                                                    </td>

                                                                    <td className="px-3 py-4 whitespace-nowrap text-right">
                                                                        {isEditing && (
                                                                            <button
                                                                                onClick={() => saveRow(task.id)}
                                                                                className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                                                            >
                                                                                Save
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                            <h3 className="text-lg font-medium text-red-800">Access Denied</h3>
                                            <p className="mt-2 text-red-600">You do not have permission to view the Profitability Analysis.</p>
                                        </div>
                                    )}
                                </>
                            )}
                            {activeTab === 'cost_centers' && <CostCentersTab />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


export default ChequesAndBalances;
