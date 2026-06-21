'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Receipt, Upload, LogOut } from 'lucide-react';

const navItems = [
  { href: '/profile', label: 'โปรไฟล์', icon: User },
  { href: '/my-receipts', label: 'ใบเสร็จของฉัน', icon: Receipt },
  { href: '/upload-proof', label: 'อัพโหลดสลิป', icon: Upload },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r flex flex-col shrink-0">
        <div className="px-5 py-5 border-b">
          <Link href="/profile" className="text-xl font-bold text-indigo-600">
            สหกรณ์
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">
            {user.first_name} {user.last_name}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="flex-1 px-8 py-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
