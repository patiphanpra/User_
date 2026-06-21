'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

type Mode = 'member' | 'staff';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setAccessToken } = useAuthStore();

  // Member fields
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');

  // Staff fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      let result;
      if (mode === 'member') {
        result = await authApi.memberLogin(nationalId, phone);
      } else {
        result = await authApi.login(email, password);
      }
      setAccessToken(result.access_token);
      setUser(result.user);
      router.push(result.user.role === 'admin' || result.user.role === 'staff' ? '/dashboard' : '/profile');
    } catch (err: any) {
      setError(err.message || err.error || 'เข้าสู่ระบบล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-center text-gray-900">เข้าสู่ระบบ</h1>
        <p className="text-center text-gray-600 text-sm mt-1">ระบบจัดการสมาชิกสหกรณ์การศึกษา</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border overflow-hidden">
        <button
          type="button"
          onClick={() => { setMode('member'); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'member' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          สมาชิก
        </button>
        <button
          type="button"
          onClick={() => { setMode('staff'); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'staff' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          เจ้าหน้าที่ / ผู้ดูแล
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'member' ? (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">เลขบัตรประจำตัวประชาชน</label>
              <Input
                placeholder="XXXXXXXXXXXXX (13 หลัก)"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, '').slice(0, 13))}
                inputMode="numeric"
                maxLength={13}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
              <Input
                placeholder="0XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                maxLength={10}
                disabled={isLoading}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">อีเมล</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <Input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </Button>
      </form>
    </div>
  );
}