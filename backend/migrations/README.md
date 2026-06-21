# Database Migrations

This directory contains all PostgreSQL migrations for the Member Management System, using the `golang-migrate` format.

## Migration Files Format

Each migration consists of two files:
- `XXX_description.up.sql` - Applied when running migrations up
- `XXX_description.down.sql` - Applied when running migrations down (rollback)

## Migration Overview

### Schema Migrations

| # | File | Purpose |
|---|------|---------|
| 001 | create_base_types | Create PostgreSQL ENUMs for status fields |
| 002 | create_users | Create users table (admin/staff) |
| 003 | create_receipt_types | Create receipt_types lookup table |
| 004 | create_members | Create members table |
| 005 | create_receipts | Create receipts table |
| 006 | create_files | Create files table for documents |
| 007 | create_death_records | Create death_records table |
| 008 | create_otp_tokens | Create otp_tokens table |
| 009 | create_audit_logs | Create audit_logs table with JSONB |
| 010 | create_refresh_tokens | Create refresh_tokens table |

### Seed Migrations

| # | File | Purpose |
|---|------|---------|
| 011 | seed_receipt_types | Insert 9 receipt types (ค่าสมาชิกภาพ, บริจาค, etc.) |
| 012 | seed_default_admin | Insert default admin user |

## Installation & Setup

### 1. Install golang-migrate

**On macOS:**
```bash
brew install migrate
```

**On Linux:**
```bash
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/
```

**On Windows (using Docker):**
```bash
docker run -v $(pwd)/backend/migrations:/migrations migrate/migrate -path=/migrations -database "postgresql://..." up
```

### 2. Run Migrations

**Apply all migrations:**
```bash
migrate -path backend/migrations -database "postgresql://postgres:postgres@localhost:5432/member_mgmt?sslmode=disable" up
```

**Rollback migrations:**
```bash
migrate -path backend/migrations -database "postgresql://..." down
```

**Get current version:**
```bash
migrate -path backend/migrations -database "postgresql://..." version
```

## Default Data

### Receipt Types (9 types)
- สมาชิกภาพ (Membership dues)
- บริจาค (Donation)
- ชำระเงินกู้ (Loan repayment)
- ฝากเงินประหยัด (Savings deposit)
- เงินปันผล (Dividend)
- คืนเงิน (Refund)
- เบิกเงิน (Withdrawal)
- ค่าปรับ (Fine)
- อื่น ๆ (Other)

### Default Admin User
- Email: `admin@coop.local`
- Password: `admin123` (⚠️ Change in production!)
- Role: `admin`
