'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi } from '@/lib/api';
import type { Member, PaginatedResponse } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getMemberStatusLabel, getMemberStatusBadgeColor } from '@/lib/utils';
import Link from 'next/link';
import { Download, Plus, Search } from 'lucide-react';

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [memberType, setMemberType] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Member>>({
    queryKey: ['members', page, search, status, memberType],
    queryFn: async () => {
      const response = await memberApi.list(page, 10, {
        ...(search && { search }),
        ...(status && { status }),
        ...(memberType && { member_type: memberType }),
      });
      return response;
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      memberApi.export({
        ...(search && { search }),
        ...(status && { status }),
        ...(memberType && { member_type: memberType }),
      }),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `members-${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">สมาชิก</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/members/new" className="flex gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มสมาชิก
            </Link>
          </Button>
          <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            <Download className="w-4 h-4 mr-2" />
            {exportMutation.isPending
              ? 'กำลังส่งออก...'
              : (search || status || memberType)
              ? 'ส่งออก CSV (ตามตัวกรอง)'
              : 'ส่งออก CSV'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="ค้นหาชื่อหรือเบอร์โทรศัพท์..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
            <select
              value={memberType}
              onChange={(e) => {
                setMemberType(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">ประเภททั้งหมด</option>
              <option value="regular">สมาชิกทั่วไป</option>
              <option value="associate">สมาชิกสมทบ</option>
            </select>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="active">{getMemberStatusLabel('active')}</option>
              <option value="inactive">{getMemberStatusLabel('inactive')}</option>
              <option value="suspended">{getMemberStatusLabel('suspended')}</option>
              <option value="resigned">{getMemberStatusLabel('resigned')}</option>
              <option value="deceased">{getMemberStatusLabel('deceased')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ - นามสกุล</TableHead>
                  <TableHead>เบอร์โทรศัพท์</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ลงทะเบียน</TableHead>
                  <TableHead>ดำเนิน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data?.data && data.data.length > 0 ? (
                  data.data.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {(member as any).title}{member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{member.membership_no}</div>
                        </div>
                      </TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.member_type === 'regular' ? 'สมาชิกทั่วไป' : 'สมาชิกสมทบ'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMemberStatusBadgeColor(member.status)}>
                          {getMemberStatusLabel(member.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.created_at).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/members/${member.id}`}>ดู</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      ไม่พบข้อมูลสมาชิก
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {data?.total_pages && data.total_pages > 1 && (
            <div className="border-t p-4 flex gap-2 justify-between items-center">
              <div className="text-sm text-gray-600">
                หน้า {page} จาก {data.total_pages} (ทั้งหมด {data.total} รายการ)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  ← ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                  disabled={page === data.total_pages}
                >
                  ถัดไป →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}