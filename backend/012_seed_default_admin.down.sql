-- 012_seed_default_admin.down.sql
-- Remove default admin user

DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
