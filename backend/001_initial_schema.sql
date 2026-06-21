-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('admin', 'staff')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Create Members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY,
    membership_no VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    id_card VARCHAR(20) UNIQUE,
    address TEXT,
    district VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(10),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    membership_date DATE NOT NULL,
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended', 'resigned', 'deceased')),
    CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_members_membership_no ON members(membership_no);
CREATE INDEX idx_members_deleted_at ON members(deleted_at);
CREATE INDEX idx_members_status ON members(status);

-- Create OTP table
CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_used CHECK (used IN (TRUE, FALSE))
);

CREATE INDEX idx_otps_phone ON otps(phone);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);

-- Create Member Documents table
CREATE TABLE IF NOT EXISTS member_documents (
    id UUID PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

CREATE INDEX idx_documents_member_id ON member_documents(member_id);
CREATE INDEX idx_documents_verification_status ON member_documents(verification_status);

-- Create Refresh Tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
