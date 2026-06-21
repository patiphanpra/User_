'use client';

import React, { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verifyOtpSchema, VerifyOtpInput } from '@/lib/schemas/auth';
import { OTPInput } from '@/components/common/OTPInput';
import { authApi } from '@/lib/api';

function VerifyOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.push('/forgot-password');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, router]);

  const form = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: '',
      sessionId: sessionId || '',
    },
  });

  const onSubmit = async (data: VerifyOtpInput) => {
    try {
      setIsLoading(true);
      setError(null);
      await authApi.verifyOtp(data.sessionId, data.otp);

      router.push(`/reset-password?sessionId=${data.sessionId}`);
    } catch (err: any) {
      const message = err.error || err.message || 'รหัส OTP ไม่ถูกต้อง';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-center text-gray-900">ยืนยันรหัส OTP</h1>
        <p className="text-center text-gray-600 text-sm mt-2">
          กรุณากรอกรหัส OTP 6 หลักที่ส่งมายังโทรศัพท์ของคุณ
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>รหัส OTP</FormLabel>
                <FormControl>
                  <OTPInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-center text-sm text-gray-600">
            {timeLeft > 0 ? (
              <>
                หมดอายุใน <span className="font-bold text-red-600">{formatTime(timeLeft)}</span>
              </>
            ) : (
              <span className="text-red-600 font-medium">รหัส OTP หมดอายุแล้ว</span>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || timeLeft === 0 || form.watch('otp').length !== 6}
          >
            {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยัน'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm space-y-2">
        <button
          onClick={() => router.push('/forgot-password')}
          disabled={!canResend}
          className={`block w-full font-medium ${
            canResend
              ? 'text-indigo-600 hover:text-indigo-700'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          ส่งรหัส OTP อีกครั้ง
        </button>
        <button
          onClick={() => router.push('/login')}
          className="text-gray-600 hover:text-gray-700 block w-full"
        >
          กลับไปที่หน้า Login
        </button>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
          <VerifyOTPForm />
        </Suspense>
      </div>
    </div>
  );
}