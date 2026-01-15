export type EventStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export interface Event {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    start_date: string | null; // ISO string
    end_date: string | null;   // ISO string
    status: EventStatus;
    created_at: string;
}

export interface Profile {
    id: string;
    full_name: string | null;
    email?: string | null;
    phone: string | null;
    role: 'Admin' | 'Manager' | 'Staff' | null;
    status: 'Pending' | 'Active' | 'Suspended' | null;
    avatar_url: string | null;
    updated_at: string | null;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Pending' | 'Acknowledged' | 'In Review' | 'In Progress' | 'Awaiting Approval' | 'Completed' | 'On Hold';

export interface Task {
    id: string;
    event_id: string | null;
    title: string;
    description: string | null;
    assignee_id: string | null;
    priority: TaskPriority | null;
    status: TaskStatus;
    deadline: string | null;
    created_at: string;
    acknowledged_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    profiles?: Profile | null; // For joined assignee query
    events?: Event | null; // For joined event query

    // New Fields
    custom_id?: string | null;
    quantity_required?: number | null;
    actual_cost?: number | null;
    vendor_name?: string | null;
    vendor_address?: string | null;
    vendor_contact?: string | null;

    // Profitability Fields
    cost_to_client?: number | null;
    unit_type?: string | null; // e.g., 'Piece', 'Hour', 'Day'
    billable_quantity?: number | null;
    profitability_comments?: string | null;
}

export interface ExpenseRequest {
    id: string;
    created_at: string;
    updated_at: string;
    requester_id: string;
    request_date: string;
    type: 'Task' | 'Miscellaneous';
    task_id?: string | null;
    description: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Paid_Confirmed' | 'Changes_Requested';
    attachment_url?: string | null;
    requester_comments?: string | null;
    rejection_reason?: string | null;

    // Joined fields
    tasks?: { title: string } | null;
    profiles?: { full_name: string; avatar_url: string | null } | null;
}

export interface InventoryItem {
    id: string;
    item_name: string;
    category: string | null;
    current_stock: number;
    min_stock_level: number;
    supplier_info: Record<string, unknown> | null;
    image_url: string | null;
}

export interface TaskAttachment {
    id: string;
    task_id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    uploaded_by: string;
    context: 'creation' | 'submission' | 'comment';
    created_at: string;
}

export type ExpenseType = 'Cash' | 'Cheque' | 'Transfer' | 'Card' | 'Other';
export type ExpenseStatus = 'Pending' | 'Cleared' | 'Bounce' | 'Cancelled';

export interface Expense {
    id: string;
    title: string;
    amount: number;
    type: ExpenseType;
    cheque_number?: string | null;
    cheque_date?: string | null;
    status: ExpenseStatus;
    task_id?: string | null;
    vendor?: string | null;
    created_by: string;
    created_at: string;
    // New Cost Center Fields
    parent_cost_center_id?: string | null;
    child_cost_center_id?: string | null;
}

export interface CostCenter {
    id: string;
    created_at: string;
    type: 'Parent' | 'Child';
    code: string;
    title: string;
    description: string | null;
}

export interface ExpenseRequest {
    id: string;
    created_at: string;
    updated_at: string;
    requester_id: string;
    request_date: string;
    type: 'Task' | 'Miscellaneous';
    task_id?: string | null;
    description: string;
    amount: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Paid_Confirmed' | 'Changes_Requested';
    attachment_url?: string | null;
    requester_comments?: string | null;
    rejection_reason?: string | null;

    // Cost Center
    parent_cost_center_id?: string | null;
    child_cost_center_id?: string | null;

    // Joined fields
    tasks?: { title: string } | null;
    profiles?: { full_name: string; avatar_url: string | null } | null;
    parent_cost_center?: CostCenter | null;
    child_cost_center?: CostCenter | null;
}

export interface Event {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    start_date: string | null; // ISO string
    end_date: string | null;   // ISO string
    status: EventStatus;
    created_at: string;
    cost_center_code?: string | null;
}
