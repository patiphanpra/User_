'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { receiptApi, receiptDownloadApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, getReceiptStatusLabel, getReceiptStatusBadgeColor } from '@/lib/utils';
import { Download } from 'lucide-react';

const handleDownload = async (id: string, receiptNumber: string) => {
  const blob = await receiptDownloadApi.download(id);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${receiptNumber}.html`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default function MyReceiptsPage() {
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['my-receipts', user?.id, page],
    queryFn: () => receiptApi.getMemberReceipts(user!.id, page, 10),
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ใบเสร็จของฉัน</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>จำนวนเงิน</TableHead>
                  <TableHead>ประเภท</TableHead>
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
                          <Download className="w-4 h-4 mr-2" />
                          ดาวน์โหลด
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      ไม่พบใบเสร็จของคุณ
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
