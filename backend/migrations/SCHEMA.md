# Schema Documentation

## Complete Database Schema for Member Management System

### Types & Enums (001_create_base_types)

```sql
user_role: 'admin' | 'staff'
user_status: 'active' | 'inactive' | 'suspended'
member_status: 'active' | 'inactive' | 'suspended' | 'resigned' | 'deceased'
verification_status: 'pending' | 'verified' | 'rejected'
receipt_status: 'pending' | 'approved' | 'rejected' | 'void'
file_type: 'id_card' | 'thainoi' | 'license' | 'certificate' | 'document' | 'receipt' | 'other'
document_verification_status: 'pending' | 'verified' | 'rejected' | 'needsrevision'
```

### Table: users (002_create_users)

Admin and staff user accounts.

```
id                UUID PRIMARY KEY
email             VARCHAR(255) UNIQUE NOT NULL
phone             VARCHAR(20)
password_hash     VARCHAR(255) NOT NULL
first_name        VARCHAR(100) NOT NULL
last_name         VARCHAR(100) NOT NULL
role              user_role DEFAULT 'staff'
status            user_status DEFAULT 'active'
last_login_at     TIMESTAMP
created_at        TIMESTAMP DEFAULT now()
updated_at        TIMESTAMP DEFAULT now()
deleted_at        TIMESTAMP (soft delete)

Indexes:
- email, phone, role, status, deleted_at
```

### Table: receipt_types (003_create_receipt_types)

Lookup table for receipt categories.

```
id                UUID PRIMARY KEY
code              VARCHAR(50) UNIQUE NOT NULL
name              VARCHAR(100) NOT NULL (Thai names)
description       TEXT
display_order     INT DEFAULT 0
is_active         BOOLEAN DEFAULT TRUE
created_at        TIMESTAMP DEFAULT now()
updated_at        TIMESTAMP DEFAULT now()

Indexes:
- code, is_active

Seed Data (9 types):
1. dues - สมาชิกภาพ (Membership dues)
2. donation - บริจาค (Donation)
3. loan_repay - ชำระเงินกู้ (Loan repayment)
4. savings_deposit - ฝากเงินประหยัด (Savings deposit)
5. dividend - เงินปันผล (Dividend)
6. refund - คืนเงิน (Refund)
7. withdrawal - เบิกเงิน (Withdrawal)
8. fine - ค่าปรับ (Fine)
9. other - อื่น ๆ (Other)
```

### Table: members (004_create_members)

Cooperative member information.

```
id                      UUID PRIMARY KEY
membership_no           VARCHAR(50) UNIQUE NOT NULL
title                   VARCHAR(20) (นาย, นาง, นางสาว)
first_name              VARCHAR(100) NOT NULL
last_name               VARCHAR(100) NOT NULL
email                   VARCHAR(255)
phone                   VARCHAR(20) NOT NULL
date_of_birth           DATE
id_card                 VARCHAR(20) UNIQUE
address                 TEXT
sub_district            VARCHAR(100) (ตำบล)
district                VARCHAR(100) (อำเภอ)
province                VARCHAR(100) (จังหวัด)
postal_code             VARCHAR(10)
status                  member_status DEFAULT 'active'
membership_date         DATE NOT NULL
membership_end_date     DATE (for resigned/deceased)
verification_status     verification_status DEFAULT 'pending'
verified_by             UUID -> users(id)
verified_at             TIMESTAMP
profile_image_url       VARCHAR(500)
line_user_id            VARCHAR(255) (for Line Bot OTP)
notes                   TEXT
created_at              TIMESTAMP DEFAULT now()
updated_at              TIMESTAMP DEFAULT now()
deleted_at              TIMESTAMP (soft delete)

Indexes:
- membership_no, email, phone, id_card, status
- verification_status, membership_date, deleted_at
- line_user_id
```

### Table: receipts (005_create_receipts)

Member receipts/transactions.

```
id                UUID PRIMARY KEY
receipt_number    VARCHAR(50) UNIQUE NOT NULL
member_id         UUID NOT NULL -> members(id) CASCADE
receipt_type_id   UUID NOT NULL -> receipt_types(id) RESTRICT
amount            DECIMAL(12, 2) NOT NULL
issue_date        DATE NOT NULL
received_date     DATE
status            receipt_status DEFAULT 'pending'
issued_by         UUID -> users(id)
verified_by       UUID -> users(id)
verified_at       TIMESTAMP
notes             TEXT
created_at        TIMESTAMP DEFAULT now()
updated_at        TIMESTAMP DEFAULT now()

Indexes:
- receipt_number, member_id, receipt_type_id
- status, issue_date, created_at
```

### Table: files (006_create_files)

Document/file storage metadata.

```
id                      UUID PRIMARY KEY
member_id               UUID NOT NULL -> members(id) CASCADE
file_name               VARCHAR(255) NOT NULL
file_type              file_type NOT NULL
file_url               VARCHAR(500) NOT NULL (R2/S3 URL)
file_size              BIGINT (bytes)
mime_type              VARCHAR(100)
verification_status    document_verification_status DEFAULT 'pending'
uploaded_by            UUID NOT NULL -> users(id) RESTRICT
verified_by            UUID -> users(id)
verified_at            TIMESTAMP
rejection_reason       TEXT
created_at             TIMESTAMP DEFAULT now()
updated_at             TIMESTAMP DEFAULT now()
deleted_at             TIMESTAMP (soft delete)

Indexes:
- member_id, file_type, verification_status
- created_at, deleted_at
```

### Table: death_records (007_create_death_records)

Track deceased members for compliance.

```
id                      UUID PRIMARY KEY
member_id               UUID NOT NULL UNIQUE -> members(id) CASCADE
death_date              DATE NOT NULL
death_certificate_url   VARCHAR(500) (R2/S3 URL)
death_location          TEXT
recorded_by             UUID NOT NULL -> users(id) RESTRICT
notes                   TEXT
created_at              TIMESTAMP DEFAULT now()
updated_at              TIMESTAMP DEFAULT now()

Indexes:
- member_id, death_date, created_at

Note: One-to-one relationship (UNIQUE on member_id)
```

### Table: otp_tokens (008_create_otp_tokens)

OTP authentication tokens.

```
id                UUID PRIMARY KEY
phone             VARCHAR(20) NOT NULL
code              VARCHAR(10) NOT NULL
attempts          INT DEFAULT 0
max_attempts      INT DEFAULT 5
expires_at        TIMESTAMP NOT NULL (5 minutes)
used              BOOLEAN DEFAULT FALSE
used_at           TIMESTAMP
created_at        TIMESTAMP DEFAULT now()
updated_at        TIMESTAMP DEFAULT now()

Indexes:
- phone, expires_at, used, created_at

Typical TTL: 5 minutes
```

### Table: audit_logs (009_create_audit_logs)

Change tracking for compliance and debugging.

```
id                UUID PRIMARY KEY
user_id           UUID -> users(id)
entity_type       VARCHAR(100) NOT NULL (table name)
entity_id         UUID NOT NULL (record ID)
action            VARCHAR(50) NOT NULL (CREATE, UPDATE, DELETE)
changes           JSONB (before/after values)
ip_address        VARCHAR(45)
user_agent        TEXT
created_at        TIMESTAMP DEFAULT now()

Indexes:
- user_id, entity_type, entity_id, action, created_at
- GIN index on changes for JSONB queries
- Composite: (entity_type, entity_id)
```

### Table: refresh_tokens (010_create_refresh_tokens)

JWT refresh token management (sessions).

```
id                UUID PRIMARY KEY
user_id           UUID NOT NULL -> users(id) CASCADE
token_hash        VARCHAR(255) UNIQUE NOT NULL
expires_at        TIMESTAMP NOT NULL (7 days)
revoked_at        TIMESTAMP (for logout)
created_at        TIMESTAMP DEFAULT now()

Indexes:
- user_id, token_hash, expires_at

Typical TTL: 7 days
Auto-cleanup: Remove tokens where revoked_at < past and expires_at < now
```

## Relationships & Constraints

```
users (1) ──────────── (M) members (verified_by)
users (1) ──────────── (M) receipts (issued_by)
users (1) ──────────── (M) receipts (verified_by)
users (1) ──────────── (M) files (uploaded_by)
users (1) ──────────── (M) files (verified_by)
users (1) ──────────── (M) death_records (recorded_by)
users (1) ──────────── (M) audit_logs (user_id)
users (1) ──────────── (M) refresh_tokens

receipt_types (1) ──── (M) receipts (receipt_type_id)

members (1) ────────── (M) receipts (CASCADE on delete)
members (1) ────────── (M) files (CASCADE on delete)
members (1) ────────── (1) death_records (UNIQUE on member_id)
```

## Performance Considerations

- 30+ indexes optimized for common queries
- Soft deletes via `deleted_at` for audit trail
- JSONB indexing for audit_logs searches
- Composite indexes for frequently joined tables
- Partitioning ready for audit_logs (time-based)

## Backup & Recovery

```bash
# Full backup
pg_dump member_mgmt > backup.sql

# Selective backup (members only)
pg_dump -t members member_mgmt > members_backup.sql

# Restore
psql member_mgmt < backup.sql
```

## Default Data

**Admin User** (seed 012):
- ID: `00000000-0000-0000-0000-000000000001`
- Email: `admin@coop.local`
- Password: `admin123` (CHANGE IN PRODUCTION!)
- Phone: `+66800000000`

**Receipt Types** (seed 011):
9 predefined types in Thai language

## Migration Timeline

```
001 ──> Types
002 ──> Users
003 ──> Receipt Types
004 ──> Members
005 ──> Receipts
006 ──> Files
007 ──> Death Records
008 ──> OTP Tokens
009 ──> Audit Logs
010 ──> Refresh Tokens
011 ──> Seed Receipt Types
012 ──> Seed Default Admin
```
