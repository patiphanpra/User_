-- 007_create_death_records.up.sql
-- Create death_records table

CREATE TABLE death_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL UNIQUE,
    death_date DATE NOT NULL,
    death_certificate_url VARCHAR(500),
    death_location TEXT,
    recorded_by UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_death_records_member_id ON death_records(member_id);
CREATE INDEX idx_death_records_death_date ON death_records(death_date);
CREATE INDEX idx_death_records_created_at ON death_records(created_at);
