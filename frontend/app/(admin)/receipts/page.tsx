'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receiptApi, receiptDownloadApi } from '@/lib/api';
import { Download } from 'lucide-react';
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
import { formatCurrency, getReceiptStatusLabel, getReceiptStatusBadgeColor } from '@/lib/utils';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const handleDownload = async (id: string, receiptNumber: string) => {
  const blob = await receiptDownloadApi.download(id);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${receiptNumber}.html`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function ReceiptsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', page, search, status],
    queryFn: async () => {
      const response = await receiptApi.list(page, 10, {
        ...(search && { search }),
        ...(status && { status }),
      });
      return response;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">ใบเสร็จ</h1>
        <Button asChild>
          <Link href="/receipts/new" className="flex gap-2">
            <Plus className="w-4 h-4" />
            สร้างใบเสร็จ
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="ค้นหารหัสอ้างอิง..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">สถานะทั้งหมด</option>
              <option value="pending">รอการอนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
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
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ดำเนิน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data?.data && data.data.length > 0 ? (
                  data.data.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {formatCurrency(receipt.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">ค่าสมาชิกภาพ</Badge>
                      </TableCell>
                      <TableCell>ปกติ</TableCell>
                      <TableCell>
                        {receipt.issue_date ? new Date(receipt.issue_date).toLocaleDateString('th-TH') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getReceiptStatusBadgeColor(receipt.status)}>
                          {getReceiptStatusLabel(receipt.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(receipt.id, (receipt as any).receipt_number || receipt.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          ดาวน์โหลด
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      ไม่พบข้อมูลใบเสร็จ
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {data?.total_pages && data.total_pages > 1 && (
            <div className="border-t p-4 flex gap-2 justify-between items-center">
              <div className="text-sm text-gray-600">
                หน้า {page} จาก {data.total_pages}
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
