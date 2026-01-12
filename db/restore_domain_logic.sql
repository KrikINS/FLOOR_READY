-- =========================================================
-- RESTORE DOMAIN LOGIC SCRIPT (ROBUST VERSION)
-- Purpose: Restore Tables and Policies broken by Profiles Reset
-- =========================================================
-- 1. Ensure Tables Exist (Safe if they already do)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Planning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tasks (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    category TEXT,
    current_stock INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    supplier_info JSONB,
    image_url TEXT
);
CREATE TABLE IF NOT EXISTS task_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_required INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS task_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    comment TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_updates ENABLE ROW LEVEL SECURITY;
-- 3. RESTORE POLICIES (DROP FIRST TO AVOID "ALREADY EXISTS" ERRORS)
-- === EVENTS ===
DROP POLICY IF EXISTS "Everyone can view events" ON events;
DROP POLICY IF EXISTS "Admins and Managers can manage events" ON events;
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
-- === TASKS ===
DROP POLICY IF EXISTS "Everyone can view tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Admins and Managers can manage tasks" ON tasks;
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
CREATE POLICY "Admins and Managers can manage tasks" ON tasks FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Admin', 'Manager')
    )
);
-- === INVENTORY ===
DROP POLICY IF EXISTS "Inventory is viewable by everyone" ON inventory;
DROP POLICY IF EXISTS "Managers can update stock" ON inventory;
CREATE POLICY "Inventory is viewable by everyone" ON inventory FOR
SELECT USING (true);
CREATE POLICY "Managers can update stock" ON inventory FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
            AND role IN ('Admin', 'Manager')
    )
);
-- === TASK UPDATES ===
DROP POLICY IF EXISTS "View updates" ON task_updates;
DROP POLICY IF EXISTS "Create updates" ON task_updates;
CREATE POLICY "View updates" ON task_updates FOR
SELECT USING (true);
CREATE POLICY "Create updates" ON task_updates FOR
INSERT WITH CHECK (auth.uid() = user_id);
SELECT 'Domain Logic Restored Successfully' as status;