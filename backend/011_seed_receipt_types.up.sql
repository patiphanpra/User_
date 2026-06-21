-- 011_seed_receipt_types.up.sql
-- Seed receipt types data

INSERT INTO receipt_types (code, name, description, display_order, is_active)
VALUES
    ('dues', 'สมาชิกภาพ', 'ค่าสมาชิกภาพประจำปี', 1, TRUE),
    ('donation', 'บริจาค', 'เงินบริจาคเพื่อสนับสนุนสหกรณ์', 2, TRUE),
    ('loan_repay', 'ชำระเงินกู้', 'ส่วนหนึ่งของการชำระหนี้เงินกู้', 3, TRUE),
    ('savings_deposit', 'ฝากเงินประหยัด', 'เงินฝากประหยัดประจำสมาชิก', 4, TRUE),
    ('dividend', 'เงินปันผล', 'เงินปันผลจากกำไรประจำปี', 5, TRUE),
    ('refund', 'คืนเงิน', 'การคืนเงินให้สมาชิก', 6, TRUE),
    ('withdrawal', 'เบิกเงิน', 'การเบิกเงินออกจากบัญชีประหยัด', 7, TRUE),
    ('fine', 'ค่าปรับ', 'ค่าปรับตามข้อบัญญัติสหกรณ์', 8, TRUE),
    ('other', 'อื่น ๆ', 'รายการอื่น ๆ', 99, TRUE);
