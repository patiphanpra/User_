import { z } from 'zod';

const thaiIdChecksum = (id: string): boolean => {
  if (id.length !== 13) return false;
  if (!/^\d{13}$/.test(id)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id[i], 10) * (13 - i);
  }

  const checksum = (11 - (sum % 11)) % 10;
  return checksum === parseInt(id[12], 10);
};

export const memberSchema = z.object({
  national_id: z.string()
    .refine(
      (val) => val === '' || (val.length === 13 && thaiIdChecksum(val)),
      'รหัสประจำตัวประชาชนไม่ถูกต้อง'
    )
    .optional()
    .default(''),
  title: z.string().min(1, 'กรุณาเลือกคำนำหน้าชื่อ'),
  first_name: z.string().min(1, 'กรุณากรอกชื่อ'),
  last_name: z.string().min(1, 'กรุณากรอกนามสกุล'),
  date_of_birth: z.string().refine((date) => {
    if (!date) return true;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'วันเดือนปีเกิดไม่ถูกต้อง').optional().default(''),
  phone: z.string()
    .regex(/^[0-9]{10}$/, 'เบอร์โทรศัพท์ต้องมี 10 หลัก'),
  email: z.string().refine(
    (val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'อีเมลไม่ถูกต้อง'
  ).optional().default(''),
  address: z.string().optional().default(''),
  district: z.string().optional().default(''),
  province: z.string().optional().default(''),
  postal_code: z.string()
    .refine((val) => val === '' || /^[0-9]{5}$/.test(val), 'รหัสไปรษณีย์ต้องมี 5 หลัก')
    .optional()
    .default(''),
  occupation: z.string().optional().default(''),
  member_type: z.enum(['regular', 'associate'], {
    errorMap: () => ({ message: 'ประเภทสมาชิกไม่ถูกต้อง' }),
  }),
  status: z.enum(['active', 'inactive', 'suspended', 'resigned', 'deceased'], {
    errorMap: () => ({ message: 'สถานะไม่ถูกต้อง' }),
  }).optional().default('active'),
});

export type MemberInput = z.infer<typeof memberSchema>;

export const receiptSchema = z.object({
  member_id: z.string().uuid('ไม่มีสมาชิกที่ถูกต้อง'),
  receipt_type_id: z.string().uuid('ไม่มีประเภทใบเสร็จที่ถูกต้อง'),
  amount: z.number().positive('จำนวนเงินต้องมากกว่า 0'),
  category: z.enum(['normal', 'special'], {
    errorMap: () => ({ message: 'หมวดหมู่ไม่ถูกต้อง' }),
  }),
  notes: z.string().optional(),
  receipt_date: z.string().refine((date) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }, 'วันที่ไม่ถูกต้อง'),
});

export type ReceiptInput = z.infer<typeof receiptSchema>;

export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'ไฟล์ต้องมีขนาดไม่เกิน 10MB')
    .refine(
      (file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type),
      'เพื่อให้ยอมรับ เฉพาะ PDF, JPG, PNG เท่านั้น'
    ),
  file_type: z.enum(['id_card', 'thainoi', 'license', 'certificate', 'document', 'receipt', 'other'], {
    errorMap: () => ({ message: 'ประเภทไฟล์ไม่ถูกต้อง' }),
  }),
  description: z.string().optional(),
  member_id: z.string().uuid('ไม่มีสมาชิกที่ถูกต้อง'),
});

export type FileUploadInput = z.infer<typeof fileUploadSchema>;