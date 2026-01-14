-- CHECK what will be deleted first
SELECT id,
    title,
    created_at,
    status
FROM public.tasks
WHERE title ILIKE '%Test%'
    OR title = 'New Task'
ORDER BY created_at DESC;
-- CHECK expenses to delete
SELECT id,
    title,
    amount
FROM public.expenses
WHERE title ILIKE '%Test%';
-- DELETE Test Tasks (Uncomment to execute)
-- DELETE FROM public.tasks WHERE title ILIKE '%Test Fulfillment Task%';
-- DELETE Test Expenses (Uncomment to execute)
-- DELETE FROM public.expenses WHERE title = 'Test Expense';
-- DELETE ALL Tasks created today (Use with CAUTION)
-- DELETE FROM public.tasks WHERE created_at > (now() - interval '24 hours');