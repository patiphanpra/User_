'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { receiptSchema, ReceiptInput } from '@/lib/schemas/member';
import { receiptApi, memberApi } from '@/lib/api';

export default function CreateReceiptPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { data: types } = useQuery({
    queryKey: ['receipt-types'],
    queryFn: async () => {
      const response = await receiptApi.listTypes();
      return response.receipt_types;
    },
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-all'],
    queryFn: () => memberApi.list(1, 100),
  });

  const form = useForm<ReceiptInput>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      member_id: '',
      receipt_type_id: '',
      amount: 0,
      category: 'normal',
      notes: '',
      receipt_date: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ReceiptInput) =>
      receiptApi.create(data as any),
    onSuccess: () => {
      router.push('/receipts');
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const onSubmit = (data: ReceiptInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">สร้างใบเสร็จใหม่</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลใบเสร็จ</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="member_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สมาชิก</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="">เลือกสมาชิก</option>
                          {membersData?.data?.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.membership_no} — {m.first_name} {m.last_name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receipt_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ประเภทใบเสร็จ</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="">เลือกประเภท</option>
                          {types?.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนเงิน</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หมวดหมู่</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="normal">ปกติ</option>
                          <option value="special">พิเศษ</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="receipt_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันที่ใบเสร็จ</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมายเหตุ (ไม่บังคับ)</FormLabel>
                    <FormControl>
                      <textarea
                        placeholder="หมายเหตุเพิ่มเติม"
                        className="w-full px-4 py-2 border rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'กำลังสร้าง...' : 'สร้างใบเสร็จ'}
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  ยกเลิก
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
