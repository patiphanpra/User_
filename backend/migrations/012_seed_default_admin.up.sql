-- 012_seed_default_admin.up.sql
-- Seed default admin user
-- Default password: admin123 (hashed with bcrypt)
-- Hash verified to match "admin123": $2a$10$8DgIjejqpexkLNR.9p3aP.2MDYvutVBJUxPKVLWXLL/WRKsu9iW3C

INSERT INTO users (
    id,
    email,
    phone,
    password,
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
    '$2a$10$8DgIjejqpexkLNR.9p3aP.2MDYvutVBJUxPKVLWXLL/WRKsu9iW3C',
    'ผู้ดูแล',
    'ระบบ',
    'admin',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
