'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authStore, useHydrated } from '@/lib/auth-store';
import { authApi } from '@/lib/api';
import { Shield, LogOut } from 'lucide-react';

export default function SelectRolePage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const roles = authStore((s) => s.roles);
  const tempToken = authStore((s) => s.tempToken);

  useEffect(() => {
    if (hydrated && !tempToken) {
      router.push('/login');
    }
  }, [hydrated, tempToken, router]);

  if (!hydrated) return null;

  const handleSelectRole = async (roleId: string) => {
    const loading = toast.loading('Seleccionando rol...');
    try {
      const { data } = await authApi.selectRole(tempToken!, roleId);
      authStore.getState().setTokens(data.accessToken, data.refreshToken);
      authStore.getState().setSelectedRol(data.rol);
      toast.success(`Sesión iniciada como ${data.rol.nombre}`, { id: loading });
      router.push('/dashboard');
    } catch {
      toast.error('Error al seleccionar rol', { id: loading });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Selecciona tu espacio de trabajo</CardTitle>
          <CardDescription>Elige el rol con el que deseas operar en esta sesión</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((rol) => (
            <Button
              key={rol.id}
              variant="outline"
              className="w-full justify-start gap-3 h-14 text-lg"
              onClick={() => handleSelectRole(rol.id)}
            >
              <Shield className="h-5 w-5 text-primary" />
              {rol.nombre}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => {
              authStore.getState().logout();
              router.push('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            Volver al inicio de sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
