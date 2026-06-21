'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
import { memberSchema, MemberInput } from '@/lib/schemas/member';
import { ThaiIDInput } from '@/components/common/ThaiIDInput';
import { memberApi } from '@/lib/api';

export default function AddMemberPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      national_id: '',
      title: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      phone: '',
      email: '',
      address: '',
      district: '',
      province: '',
      postal_code: '',
      occupation: '',
      member_type: 'regular',
      status: 'active',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MemberInput) =>
      memberApi.create(data as any),
    onSuccess: (member) => {
      router.push(`/members/${member.id}`);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const onSubmit = (data: MemberInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">เพิ่มสมาชิกใหม่</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลสมาชิก</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="national_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสประจำตัวประชาชน</FormLabel>
                      <FormControl>
                        <ThaiIDInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="member_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ประเภทสมาชิก</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="regular">สมาชิกทั่วไป</option>
                          <option value="associate">สมาชิกสมทบ</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>คำนำหน้าชื่อ</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="">เลือกคำนำหน้า</option>
                          <option value="นาย">นาย</option>
                          <option value="นาง">นาง</option>
                          <option value="นางสาว">นางสาว</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ</FormLabel>
                      <FormControl>
                        <Input placeholder="ชื่อ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>นามสกุล</FormLabel>
                      <FormControl>
                        <Input placeholder="นามสกุล" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันเกิด</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์</FormLabel>
                      <FormControl>
                        <Input placeholder="0XXXXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อีเมล</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="example@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่อยู่</FormLabel>
                    <FormControl>
                      <Input placeholder="ที่อยู่" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อำเภอ</FormLabel>
                      <FormControl>
                        <Input placeholder="อำเภอ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จังหวัด</FormLabel>
                      <FormControl>
                        <Input placeholder="จังหวัด" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รหัสไปรษณีย์</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="XXXXX"
                          inputMode="numeric"
                          maxLength={5}
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อาชีพ (ไม่บังคับ)</FormLabel>
                    <FormControl>
                      <Input placeholder="อาชีพ" {...field} />
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
                  {createMutation.isPending ? 'กำลังเพิ่ม...' : 'เพิ่มสมาชิก'}
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