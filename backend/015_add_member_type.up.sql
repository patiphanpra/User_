-- 015_add_member_type.up.sql
-- The frontend's member forms (new/edit) and list/dashboard pages have
-- referenced member_type ('regular' | 'associate', shown as
-- "สมาชิกทั่วไป"/"สมาชิกสมทบ") since they were first built, and the
-- backend's CreateMemberRequest even had a MemberType field — but the
-- column itself was never added to the members table, and the value was
-- never actually saved or read. This adds it and backfills existing rows
-- to 'regular' so nothing is left null.

ALTER TABLE members ADD COLUMN IF NOT EXISTS member_type VARCHAR(20) NOT NULL DEFAULT 'regular';

ALTER TABLE members DROP CONSTRAINT IF EXISTS valid_member_type;
ALTER TABLE members ADD CONSTRAINT valid_member_type
    CHECK (member_type IN ('regular', 'associate'));
