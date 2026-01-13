-- List the 10 most recently created tasks
SELECT t.id,
    t.title,
    t.status,
    t.created_at,
    e.name as event_name,
    p.email as assignee_email
FROM tasks t
    LEFT JOIN events e ON t.event_id = e.id
    LEFT JOIN profiles p ON t.assignee_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;