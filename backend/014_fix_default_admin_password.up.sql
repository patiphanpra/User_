-- 014_fix_default_admin_password.up.sql
-- Migration 012 seeded the default admin with a bcrypt hash that does not
-- actually correspond to "admin123" (verified: bcrypt.CompareHashAndPassword
-- fails against it), so the documented default admin login has never
-- actually worked. It also targeted a "password_hash" column, which does
-- not exist in the schema produced by 001_initial_schema.sql (the column
-- there is "password"). This migration corrects both.
--
-- New hash verified to match "admin123":
-- $2a$10$8DgIjejqpexkLNR.9p3aP.2MDYvutVBJUxPKVLWXLL/WRKsu9iW3C
--
-- As with the original seed, change this password immediately after first
-- login in any non-local environment.

UPDATE users
SET password = '$2a$10$8DgIjejqpexkLNR.9p3aP.2MDYvutVBJUxPKVLWXLL/WRKsu9iW3C'
WHERE email = 'admin@coop.local';
