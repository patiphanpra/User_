-- 004_create_members.up.sql
-- Create members table for cooperative members

CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    id_card VARCHAR(20) UNIQUE,
    address TEXT,
    sub_district VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    status member_status NOT NULL DEFAULT 'active',
    membership_date DATE NOT NULL,
    membership_end_date DATE,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID,
    verified_at TIMESTAMP,
    profile_image_url VARCHAR(500),
    line_user_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_members_membership_no ON members(membership_no);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_id_card ON members(id_card);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_verification_status ON members(verification_status);
CREATE INDEX idx_members_membership_date ON members(membership_date);
CREATE INDEX idx_members_deleted_at ON members(deleted_at);
CREATE INDEX idx_members_line_user_id ON members(line_user_id);
