'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authStore, useHydrated } from '@/lib/auth-store';
import Sidebar from '@/components/sidebar';

const adminRoutes = ['/dashboard/users', '/dashboard/roles', '/dashboard/modules', '/dashboard/menus'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const isAuthenticated = authStore((s) => !!s.accessToken);
  const selectedRol = authStore((s) => s.selectedRol);

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAdmin = selectedRol?.nombre === 'ADMIN';

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isAdminRoute && !isAdmin) {
      router.push('/dashboard');
    }
  }, [hydrated, isAuthenticated, isAdminRoute, isAdmin, router]);

  if (!hydrated) return null;
  if (!isAuthenticated) return null;
  if (isAdminRoute && !isAdmin) return null;

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
