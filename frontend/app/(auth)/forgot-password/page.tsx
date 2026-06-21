'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/schemas/auth';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authApi.forgotPassword(data.phone);
      setSessionId(response.session_id);

      // Redirect to OTP verification
      router.push(`/verify-otp?sessionId=${response.session_id}`);
    } catch (err: any) {
      const message = err.error || err.message || 'เกิดข้อผิดพลาด';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-center text-gray-900">ลืมรหัสผ่าน</h1>
        <p className="text-center text-gray-600 text-sm mt-2">
          กรุณากรอกเบอร์โทรศัพท์เพื่อรับรหัส OTP
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>เบอร์โทรศัพท์</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0XXXXXXXXX"
                    type="tel"
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
            {isLoading ? 'กำลังส่ง...' : 'ส่ง OTP'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <button
          onClick={() => router.push('/login')}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          กลับไปเข้าสู่ระบบ
        </button>
      </div>
    </div>
  );
}