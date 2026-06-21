-- 014_fix_default_admin_password.down.sql

UPDATE users
SET password = '$2a$10$SlV8/pN1VUwXJtqvI1K9Pu6T3.A3b8tJBbQvIVHmCdFOclOl./oOW'
WHERE email = 'admin@coop.local';
