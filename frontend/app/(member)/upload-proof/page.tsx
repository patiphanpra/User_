'use client';

import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fileApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, X, FileImage } from 'lucide-react';

export default function UploadProofPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('ไม่พบข้อมูลผู้ใช้');
      if (!selectedFile) throw new Error('กรุณาเลือกไฟล์สลิป');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('file_type', 'receipt');
      if (description) formData.append('description', description);

      return fileApi.upload(user.id, formData, (p) => setProgress(p));
    },
    onSuccess: () => {
      setSuccess(true);
      setSelectedFile(null);
      setDescription('');
      setProgress(0);
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err: any) => {
      setError(err.message || err.error || 'อัพโหลดไม่สำเร็จ');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setError(null); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) { setSelectedFile(file); setError(null); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">อัพโหลดสลิปโอนเงิน</h1>
        <p className="text-gray-500 mt-1">แนบหลักฐานการชำระเงินของคุณ</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">อัพโหลดสลิปสำเร็จแล้ว เจ้าหน้าที่จะตรวจสอบเร็วๆ นี้</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>แนบสลิปการโอนเงิน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* File drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              selectedFile
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileImage className="w-8 h-8 text-indigo-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-red-500"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-gray-400">
                <Upload className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">คลิกหรือลากไฟล์สลิปมาวางที่นี่</p>
                <p className="text-xs mt-1">JPG, PNG, PDF ขนาดไม่เกิน 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Progress */}
          {uploadMutation.isPending && progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>กำลังอัพโหลด...</span><span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">รายละเอียดการโอน (ไม่บังคับ)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น โอนค่าสมาชิกปี 2569 วันที่ 9 เม.ย."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>

          <Button
            className="w-full"
            disabled={uploadMutation.isPending || !selectedFile}
            onClick={() => { setError(null); uploadMutation.mutate(); }}
          >
            {uploadMutation.isPending ? 'กำลังอัพโหลด...' : 'อัพโหลดสลิป'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
