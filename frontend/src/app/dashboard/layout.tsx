'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authStore, useHydrated } from '@/lib/auth-store';
import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const isAuthenticated = authStore((s) => !!s.accessToken);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 shrink-0">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
