'use client';

import React, { useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/schemas/auth';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      sessionId: sessionId || '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setIsLoading(true);
      setError(null);
      await authApi.resetPassword(data.sessionId, data.password);
      setSuccess(true);

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const message = err.error || err.message || 'รีเซ็ตรหัสผ่านล้มเหลว';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">สำเร็จ!</h1>
          <p className="text-gray-600 text-sm mt-2">
            รีเซ็ตรหัสผ่านเสร็จแล้ว กำลังนำพาคุณไปหน้าเข้าสู่ระบบ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-center text-gray-900">รีเซ็ตรหัสผ่าน</h1>
        <p className="text-center text-gray-600 text-sm mt-2">
          กรุณากรอกรหัสผ่านใหม่
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>รหัสผ่านใหม่</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ป้อนรหัสผ่านใหม่"
                    type="password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ป้อนรหัสผ่านอีกครั้ง"
                    type="password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}