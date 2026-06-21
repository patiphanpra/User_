'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatThaiDate } from '@/lib/utils';

export default function ProfilePage() {
  const { data: authData, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await authApi.me();
      return response.user;
    },
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ชื่อ</p>
              <p className="text-lg font-medium">{authData?.first_name} {authData?.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {authData?.role === 'member' ? 'เบอร์โทรศัพท์' : 'อีเมล'}
              </p>
              <p className="text-lg font-medium">{authData?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">บทบาท</p>
              <p className="text-lg font-medium">
                {authData?.role === 'admin'
                  ? 'ผู้ดูแลระบบ'
                  : authData?.role === 'staff'
                  ? 'เจ้าหน้าที่'
                  : 'สมาชิก'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">สถานะ</p>
              <p className="text-lg font-medium">
                {authData?.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}