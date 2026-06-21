-- 005_create_receipts.up.sql
-- Create receipts table

CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    member_id UUID NOT NULL,
    receipt_type_id UUID NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    issue_date DATE NOT NULL,
    received_date DATE,
    status receipt_status NOT NULL DEFAULT 'pending',
    issued_by UUID,
    verified_by UUID,
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (receipt_type_id) REFERENCES receipt_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_member_id ON receipts(member_id);
CREATE INDEX idx_receipts_receipt_type_id ON receipts(receipt_type_id);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_issue_date ON receipts(issue_date);
CREATE INDEX idx_receipts_created_at ON receipts(created_at);
