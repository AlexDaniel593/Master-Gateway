'use client';

import Link from 'next/link';
import { authStore } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Puzzle, MenuIcon } from 'lucide-react';

const stats = [
  { label: 'Usuarios', icon: Users, href: '/dashboard/users', color: 'text-blue-500' },
  { label: 'Roles', icon: Shield, href: '/dashboard/roles', color: 'text-green-500' },
  { label: 'Módulos', icon: Puzzle, href: '/dashboard/modules', color: 'text-purple-500' },
  { label: 'Menús', icon: MenuIcon, href: '/dashboard/menus', color: 'text-orange-500' },
];

export default function DashboardPage() {
  const selectedRol = authStore((s) => s.selectedRol);
  const user = authStore((s) => s.user);
  const isAdmin = selectedRol?.nombre === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido, {user?.nombre || user?.email}
        </h1>
        <p className="text-muted-foreground">
          Sesión activa como <strong>{selectedRol?.nombre}</strong>
        </p>
      </div>

      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">{stat.label}</CardTitle>
                  <Icon className={`h-10 w-10 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <Link href={stat.href} className="text-base text-muted-foreground hover:text-primary">
                    Ir a {stat.label} →
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Panel de usuario</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>Utiliza el menú lateral para navegar por las secciones disponibles.</p>
            <p>
              Si necesitas acceso a funcionalidades administrativas, contacta al administrador del sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
