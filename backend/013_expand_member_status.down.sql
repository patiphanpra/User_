-- 013_expand_member_status.down.sql

ALTER TABLE members DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE members ADD CONSTRAINT valid_status
    CHECK (status IN ('active', 'inactive', 'suspended'));
