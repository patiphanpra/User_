-- 013_expand_member_status.up.sql
-- Expand the members.status CHECK constraint to allow 'resigned' and
-- 'deceased'. The frontend has always exposed these as status options,
-- but the original constraint only allowed active/inactive/suspended —
-- so saving a member as resigned or deceased was silently rejected by
-- the database. This also unblocks the death-record feature, which sets
-- status = 'deceased' once a death record is recorded.

ALTER TABLE members DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE members ADD CONSTRAINT valid_status
    CHECK (status IN ('active', 'inactive', 'suspended', 'resigned', 'deceased'));
