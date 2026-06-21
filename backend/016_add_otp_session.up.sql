-- 016_add_otp_session.up.sql
--
-- Adds otps.user_id, otps.verified, otps.verified_at, otps.provider_token
-- — needed for the forgot-password flow (staff/admin only — members have
-- no password). user_id records *whose* password is being reset; verified
-- is a separate flag from used so a verified OTP session can't be
-- replayed to reset the password more than once. provider_token holds
-- ThaiBulkSMS's opaque token for this OTP attempt — they generate, send,
-- and verify the actual PIN on their end, so we never store the code or
-- an expiry ourselves; the old code/expires_at columns are no longer
-- written to.

ALTER TABLE otps ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS provider_token VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON otps(user_id);

-- code and expires_at predate this migration and were NOT NULL; we no
-- longer populate them, so relax that constraint.
ALTER TABLE otps ALTER COLUMN code DROP NOT NULL;
ALTER TABLE otps ALTER COLUMN expires_at DROP NOT NULL;
