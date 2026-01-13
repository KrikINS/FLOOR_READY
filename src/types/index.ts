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
    completed_at?: string | null;
    profiles?: Profile | null; // For joined assignee query
    events?: Event | null; // For joined event query
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
