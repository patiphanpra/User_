'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { memberApi } from '@/lib/api';
import type { Member } from '@/lib/api';
import { memberSchema } from '@/lib/schemas/member';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ThaiIDInput } from '@/components/common/ThaiIDInput';
import { DeathBadge } from '@/components/common/DeathBadge';
import { RecordDeathModal } from '@/components/common/RecordDeathModal';
import { deathApi } from '@/lib/api';
import { formatThaiDate, getMemberStatusBadgeColor, getMemberStatusLabel, resolveUploadUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const memberId = params.id as string;

  const [error, setError] = useState<string | null>(null);
  const [deathModalOpen, setDeathModalOpen] = useState(false);

  const { data, isLoading } = useQuery<Member | undefined>({
    queryKey: ['members', memberId],
    queryFn: () => memberApi.get(memberId),
  });

  const { data: deathRecordData } = useQuery({
    queryKey: ['members', memberId, 'death-record'],
    queryFn: () => deathApi.get(memberId),
    enabled: !!data && data.status === 'deceased',
    retry: false,
  });
  const deathRecord = deathRecordData?.death_record;

  const form = useForm({
    resolver: zodResolver(memberSchema),
    values: data
      ? {
          national_id: (data as any).id_card || data.national_id || '',
          title: (data as any).title || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          date_of_birth: data.date_of_birth && !data.date_of_birth.startsWith('0001')
            ? data.date_of_birth.split('T')[0]
            : '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          district: (data as any).district || '',
          province: (data as any).province || '',
          postal_code: (data as any).postal_code || '',
          occupation: data.occupation || '',
          member_type: data.member_type || 'regular',
          status: data.status || 'active',
        }
      : undefined,
  });

  const updateMutation = useMutation<unknown, any, Partial<Member>>({
    mutationFn: (formData: Partial<Member>) => memberApi.update(memberId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', memberId] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const onSubmit = (formData: any) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>ไม่พบข้อมูลสมาชิก</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {(data as any).title ? `${(data as any).title}` : ''}{data.first_name} {data.last_name}
          </h1>
          <div className="flex gap-2 mt-2">
            {data.status === 'deceased' && <DeathBadge />}
            <Badge className={getMemberStatusBadgeColor(data.status)}>
              {getMemberStatusLabel(data.status)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {data.status !== 'deceased' && (
            <Button variant="destructive" onClick={() => setDeathModalOpen(true)}>
              บันทึกการเสียชีวิต
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            ย้อนกลับ
          </Button>
        </div>
      </div>

      <RecordDeathModal
        memberId={memberId}
        memberName={`${data.first_name} ${data.last_name}`}
        open={deathModalOpen}
        onOpenChange={setDeathModalOpen}
      />

      {data.status === 'deceased' && deathRecord && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">บันทึกการเสียชีวิต</p>
              <p>วันที่เสียชีวิต: {formatThaiDate(deathRecord.death_date)}</p>
              {deathRecord.death_location && <p>สถานที่: {deathRecord.death_location}</p>}
              {deathRecord.notes && <p>หมายเหตุ: {deathRecord.notes}</p>}
              {deathRecord.death_certificate_url ? (
                <a
                  href={resolveUploadUrl(deathRecord.death_certificate_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-sm"
                >
                  ดูใบมรณบัตร
                </a>
              ) : (
                <p className="text-sm">ยังไม่มีไฟล์ใบมรณบัตรแนบ</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">ข้อมูลส่วนตัว</TabsTrigger>
          <TabsTrigger value="receipts">ใบเสร็จ</TabsTrigger>
          <TabsTrigger value="files">ไฟล์</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>แก้ไขข้อมูลสมาชิก</CardTitle>
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
                            <ThaiIDInput {...field} disabled />
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
                              disabled
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
                        <FormLabel>อาชีพ</FormLabel>
                        <FormControl>
                          <Input placeholder="อาชีพ" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สถานะ</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-4 py-2 border rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
                            disabled={data.status === 'deceased'}
                          >
                            <option value="active">สมาชิกทั่วไป</option>
                            <option value="inactive">ไม่ทำงาน</option>
                            <option value="suspended">ระงับสมาชิก</option>
                            <option value="resigned">ลาออก</option>
                          </select>
                        </FormControl>
                        {data.status === 'deceased' && (
                          <p className="text-xs text-gray-500">
                            สมาชิกนี้มีบันทึกการเสียชีวิตแล้ว ไม่สามารถเปลี่ยนสถานะจากหน้านี้ได้
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                      ยกเลิก
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>ใบเสร็จของสมาชิก</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">ยังไม่มีข้อมูลใบเสร็จ</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>ไฟล์เอกสาร</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">ยังไม่มีไฟล์เอกสาร</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}