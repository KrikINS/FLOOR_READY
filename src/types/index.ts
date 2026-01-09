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
    phone: string | null;
    role: 'Admin' | 'Manager' | 'Employee' | null;
    avatar_url: string | null;
    updated_at: string | null;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';

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
