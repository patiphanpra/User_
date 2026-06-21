-- 001_create_base_types.up.sql
-- Create base types and enums

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'member');

-- User status enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Member status enum
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended', 'resigned', 'deceased');

-- Member verification status enum
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Receipt status enum
CREATE TYPE receipt_status AS ENUM ('pending', 'approved', 'rejected', 'void');

-- File type enum
CREATE TYPE file_type AS ENUM ('id_card', 'thainoi', 'license', 'certificate', 'document', 'receipt', 'other');

-- Document verification status enum
CREATE TYPE document_verification_status AS ENUM ('pending', 'verified', 'rejected', 'needsrevision');
