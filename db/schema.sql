-- 1. Profiles (Extends Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    role TEXT CHECK (role IN ('Admin', 'Manager', 'Employee')),
    -- [cite: 5]
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Planning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- [cite: 13]
);
-- 3. Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee_id UUID REFERENCES profiles(id),
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT CHECK (
        status IN (
            'Not Started',
            'In Progress',
            'Completed',
            'On Hold'
        )
    ) DEFAULT 'Not Started',
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- [cite: 5, 15]
);
-- 4. Inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    category TEXT,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    -- For low stock alerts [cite: 6]
    supplier_info JSONB,
    image_url TEXT
);
-- 5. Task-Inventory Link (The many-to-many relationship)
CREATE TABLE task_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_required INTEGER DEFAULT 1 -- [cite: 6, 15]
);
-- 6. Task Photos & Comments
CREATE TABLE task_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    comment TEXT,
    photo_url TEXT,
    -- [cite: 5, 14]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- 1. Profiles: Users can view all profiles but only edit their own [cite: 5, 17]
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR
SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- 2. Events: Managers/Admins have full control; Employees can only view 
CREATE POLICY "Everyone can view events" ON events FOR
SELECT USING (true);
CREATE POLICY "Admins and Managers can manage events" ON events FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Admin', 'Manager')
    )
);
-- 3. Tasks: Employees can only update tasks assigned to them [cite: 5, 23]
CREATE POLICY "Everyone can view tasks" ON tasks FOR
SELECT USING (true);
CREATE POLICY "Employees can update assigned tasks" ON tasks FOR
UPDATE USING (
        assignee_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('Admin', 'Manager')
        )
    );
-- 4. Inventory: Real-time visibility for all; management for Admins/Managers [cite: 2, 5]
CREATE POLICY "Inventory is viewable by everyone" ON inventory FOR
SELECT USING (true);
CREATE POLICY "Managers can update stock" ON inventory FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('Admin', 'Manager')
        )
    );