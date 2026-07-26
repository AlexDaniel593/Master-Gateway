'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usersApi } from '@/lib/api';
import type { Usuario } from '@/lib/types';
import { ArrowLeft, Loader2 } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').optional(),
  email: z.string().email('Correo inválido').optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
});

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data } = await usersApi.findOne(params.id as string);
      setUser(data);
    } catch {
      toast.error('Usuario no encontrado');
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const submission = parseWithZod(formData, { schema });
      if (submission.status !== 'success') return submission;

      try {
        await usersApi.update(params.id as string, {
          nombre: formData.get('nombre') as string,
          email: formData.get('email') as string,
          password: (formData.get('password') as string) || undefined,
        });
        toast.success('Usuario actualizado');
        router.push('/dashboard/users');
      } catch {
        toast.error('Error al actualizar usuario');
      }
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Editar usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form id={form.id} onSubmit={form.onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={user?.nombre} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña (dejar vacío para mantener)</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
