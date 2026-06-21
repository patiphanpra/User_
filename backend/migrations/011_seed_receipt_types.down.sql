-- 011_seed_receipt_types.down.sql
-- Remove seeded receipt types

DELETE FROM receipt_types WHERE code IN ('dues', 'donation', 'loan_repay', 'savings_deposit', 'dividend', 'refund', 'withdrawal', 'fine', 'other');
