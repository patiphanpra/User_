-- 012_seed_default_admin.up.sql
-- Seed default admin user
-- Default password: admin123 (hashed with bcrypt)
-- Hash generated with: bcrypt("admin123", 10) = $2a$10$SlV8/pN1VUwXJtqvI1K9Pu6T3.A3b8tJBbQvIVHmCdFOclOl./oOW

INSERT INTO users (
    id,
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    role,
    status,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@coop.local',
    '+66800000000',
    '$2a$10$SlV8/pN1VUwXJtqvI1K9Pu6T3.A3b8tJBbQvIVHmCdFOclOl./oOW',
    'ผู้ดูแล',
    'ระบบ',
    'admin',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
