'use client';

import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deathApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { daysInMonthBE, toIsoDateBE, BE_OFFSET } from '@/lib/utils';

interface RecordDeathModalProps {
  memberId: string;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export function RecordDeathModal({ memberId, memberName, open, onOpenChange }: RecordDeathModalProps) {
  const queryClient = useQueryClient();

  const now = useMemo(() => new Date(), []);
  const currentYearBE = now.getFullYear() + BE_OFFSET;

  const [day, setDay] = useState('');
  const [month, setMonth] = useState(''); // '1'..'12'
  const [yearBE, setYearBE] = useState('');
  const [deathLocation, setDeathLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [certificate, setCertificate] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Days in the selected month/year (handles leap years correctly via Gregorian year)
  const daysInMonth = useMemo(() => daysInMonthBE(month, yearBE), [month, yearBE]);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYearBE; y >= currentYearBE - 120; y--) years.push(y);
    return years;
  }, [currentYearBE]);

  const reset = () => {
    setDay('');
    setMonth('');
    setYearBE('');
    setDeathLocation('');
    setNotes('');
    setCertificate(null);
    setError(null);
  };

  // Builds the YYYY-MM-DD (Gregorian) string the backend expects, or null if
  // the selection is incomplete/invalid.
  const toIsoDate = (): string | null => toIsoDateBE(day, month, yearBE);

  const mutation = useMutation({
    mutationFn: async () => {
      const isoDate = toIsoDate();
      const formData = new FormData();
      formData.append('death_date', isoDate as string);
      if (deathLocation) formData.append('death_location', deathLocation);
      if (notes) formData.append('notes', notes);
      if (certificate) formData.append('certificate', certificate);
      return deathApi.record(memberId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'dashboard'] });
      reset();
      onOpenChange(false);
    },
    onError: (err: any) => {
      setError(err.error || err.message || 'บันทึกข้อมูลไม่สำเร็จ');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!day || !month || !yearBE) {
      setError('กรุณาระบุวันที่เสียชีวิตให้ครบ (วัน/เดือน/ปี)');
      return;
    }
    const isoDate = toIsoDate();
    if (!isoDate) {
      setError('วันที่ไม่ถูกต้อง กรุณาตรวจสอบวันที่อีกครั้ง');
      return;
    }
    if (new Date(isoDate) > now) {
      setError('วันที่เสียชีวิตต้องไม่เป็นวันที่ในอนาคต');
      return;
    }
    if (!certificate) {
      setError('กรุณาแนบไฟล์ใบมรณบัตรเพื่อเป็นหลักฐานประกอบ');
      return;
    }
    mutation.mutate();
  };

  // ดึง bg-white ออกจากตรงนี้ แล้วใช้เฉพาะการจัดการขอบเงาและการ Focus เท่านั้น
  const selectClass = 'h-10 rounded-md border border-input px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!mutation.isPending) { onOpenChange(next); if (!next) reset(); } }}>
      {/* 🟢 แก้ไขตรงนี้: เติม className เพื่อให้กล่องทึบแสง */}
      <DialogContent className="bg-white text-black sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>บันทึกการเสียชีวิต</DialogTitle>
          <DialogDescription>
            บันทึกข้อมูลการเสียชีวิตของ {memberName} ระบบจะเปลี่ยนสถานะสมาชิกเป็น &quot;เสียชีวิต&quot; โดยอัตโนมัติ
            และใช้ข้อมูลนี้สำหรับการคำนวณค่าสมทบศพ
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="death_day">วันที่เสียชีวิต (พ.ศ.) *</Label>
            <div className="grid grid-cols-3 gap-2">
              <select
                id="death_day"
                className={selectClass}
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={mutation.isPending}
              >
                <option value="">วัน</option>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                className={selectClass}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={mutation.isPending}
              >
                <option value="">เดือน</option>
                {THAI_MONTHS.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>

              <select
                className={selectClass}
                value={yearBE}
                onChange={(e) => setYearBE(e.target.value)}
                disabled={mutation.isPending}
              >
                <option value="">ปี พ.ศ.</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="death_location">สถานที่เสียชีวิต</Label>
            <Input
              id="death_location"
              placeholder="เช่น โรงพยาบาล... / บ้านเลขที่..."
              value={deathLocation}
              onChange={(e) => setDeathLocation(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="certificate">ใบมรณบัตร (JPG, PNG, PDF — ไม่เกิน 10MB) *</Label>
            <Input
              id="certificate"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setCertificate(e.target.files?.[0] || null)}
              disabled={mutation.isPending}
            />
            {certificate && (
              <p className="text-xs text-gray-500">เลือกไฟล์: {certificate.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending ? 'กำลังบันทึก...' : 'ยืนยันบันทึกการเสียชีวิต'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}