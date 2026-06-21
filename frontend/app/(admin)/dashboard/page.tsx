'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '@/lib/api';
import type { DashboardStats, Member } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Receipt {
  id: string;
  amount: number;
  issue_date: string;
  status: 'approved' | 'pending' | 'rejected';
  member_name?: string;
  receipt_type_name?: string;
}

const getStatusStyles = (status: Receipt['status']): string => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
  }
};

const getStatusLabel = (status: Receipt['status']): string => {
  switch (status) {
    case 'approved':
      return 'อนุมัติ';
    case 'pending':
      return 'รอ';
    case 'rejected':
      return 'ปฏิเสธ';
  }
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['stats', 'dashboard'],
    queryFn: async () => {
      return statsApi.getDashboard();
    },
  });

  const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>
          {isLoading ? <Skeleton className="h-10 w-20" /> : value}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-600 mt-2">ยินดีต้อนรับเข้าระบบจัดการสมาชิกสหกรณ์</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="สมาชิกทั้งหมด"
          value={data?.total_members || 0}
          color="text-blue-600"
        />
        <StatCard
          title="สมาชิกทั่วไป"
          value={data?.active_members || 0}
          color="text-green-600"
        />
        <StatCard
          title="เสียชีวิต"
          value={data?.deceased_members || 0}
          color="text-red-600"
        />
        <StatCard
          title="ค้างจ่าย"
          value={data?.pending_payments || 0}
          color="text-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>สมาชิกใหม่ล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recent_members && data.recent_members.length > 0 ? (
                <div className="space-y-4">
                {(data.recent_members as Member[]).map((member: Member) => (
                  <Link
                  key={member.id}
                  href={`/members/${member.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                  >
                  <div>
                    <div className="font-medium text-gray-900">
                    {member.first_name} {member.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {member.member_type === 'regular' ? 'สมาชิกทั่วไป' : 'สมาชิกสมทบ'}
                  </span>
                  </Link>
                ))}
                </div>
            ) : (
              <p className="text-gray-500 text-center py-4">ไม่มีข้อมูล</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ใบเสร็จล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recent_receipts && data.recent_receipts.length > 0 ? (
              <div className="space-y-4">
                              {(data?.recent_receipts as Receipt[])?.map((receipt: Receipt) => (
                                <div key={receipt.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {receipt.member_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {receipt.receipt_type_name} · {formatCurrency(receipt.amount)} · {receipt.issue_date ? new Date(receipt.issue_date).toLocaleDateString('th-TH') : '-'}
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${getStatusStyles(receipt.status)}`}>
                                    {getStatusLabel(receipt.status)}
                                  </span>
                                </div>
                              ))}
                            </div>
            ) : (
              <p className="text-gray-500 text-center py-4">ไม่มีข้อมูล</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
