'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Eye, FileImage, FileText, CheckCircle, XCircle } from 'lucide-react';
import { resolveUploadUrl } from '@/lib/utils';

const statusLabel: Record<string, string> = {
  pending: 'รอตรวจสอบ',
  verified: 'ตรวจสอบแล้ว',
  rejected: 'ปฏิเสธ',
  needsrevision: 'ต้องแก้ไข',
};
const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  needsrevision: 'bg-orange-100 text-orange-800',
};

export default function FilesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['all-files'],
    queryFn: () => api.get<{ files: any[] }>('/files').then((r: any) => r.files ?? []),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/files/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-files'] }),
  });

  const openFile = (url: string) => {
    window.open(resolveUploadUrl(url), '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">สลิปและเอกสาร</h1>
        <p className="text-gray-500 mt-1">ไฟล์ที่สมาชิกอัพโหลดทั้งหมด</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สมาชิก</TableHead>
                <TableHead>ไฟล์</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>วันที่อัพโหลด</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ดำเนิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : data && data.length > 0 ? (
                data.map((file: any) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="font-medium">{file.member_first_name} {file.member_last_name}</div>
                      <div className="text-xs text-gray-500">{file.membership_no}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {file.mime_type?.startsWith('image/') ? (
                          <FileImage className="w-4 h-4 text-blue-500" />
                        ) : (
                          <FileText className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm truncate max-w-[150px]">{file.file_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {file.file_type === 'receipt' ? 'สลิป' : file.file_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(file.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[file.verification_status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusLabel[file.verification_status] || file.verification_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => openFile(file.file_url)}>
                          <Eye className="w-4 h-4 mr-1" />
                          ดู
                        </Button>
                        {file.verification_status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: file.id, status: 'verified' })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              อนุมัติ
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              disabled={updateStatus.isPending}
                              onClick={() => updateStatus.mutate({ id: file.id, status: 'rejected' })}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              ปฏิเสธ
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    ยังไม่มีไฟล์ที่อัพโหลด
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}