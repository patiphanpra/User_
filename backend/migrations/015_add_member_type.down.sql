-- 015_add_member_type.down.sql

ALTER TABLE members DROP CONSTRAINT IF EXISTS valid_member_type;
ALTER TABLE members DROP COLUMN IF EXISTS member_type;
