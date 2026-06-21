'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  uploading?: boolean;
  progress?: number;
  disabled?: boolean;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  uploading = false,
  progress = 0,
  disabled = false,
  accept = { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
  maxSize = 10 * 1024 * 1024, // 10MB
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    disabled: disabled || uploading,
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'ลากไฟล์มาที่นี่' : 'ลากไฟล์มาที่นี่หรือคลิกเพื่อเลือก'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, JPG, PNG (สูงสุด 10MB)
        </p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>กำลังอัพโหลด...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
};
