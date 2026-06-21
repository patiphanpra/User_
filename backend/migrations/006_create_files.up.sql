-- 006_create_files.up.sql
-- Create files table for document storage

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type file_type NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    verification_status document_verification_status NOT NULL DEFAULT 'pending',
    uploaded_by UUID NOT NULL,
    verified_by UUID,
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_files_member_id ON files(member_id);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_verification_status ON files(verification_status);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_deleted_at ON files(deleted_at);
