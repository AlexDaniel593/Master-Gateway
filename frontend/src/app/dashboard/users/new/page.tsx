'use client';

import { useRouter } from 'next/navigation';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usersApi } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export default function NewUserPage() {
  const router = useRouter();

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
        await usersApi.create({
          nombre: formData.get('nombre') as string,
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        });
        toast.success('Usuario creado');
        router.push('/dashboard/users');
      } catch {
        toast.error('Error al crear usuario');
      }
    },
  });

  return (
    <div className="space-y-4 max-w-md">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Nuevo usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form id={form.id} onSubmit={form.onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" placeholder="Nombre completo" required />
              {fields.nombre.errors && <p className="text-sm text-destructive">{fields.nombre.errors}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="correo@ejemplo.com" required />
              {fields.email.errors && <p className="text-sm text-destructive">{fields.email.errors}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
              {fields.password.errors && <p className="text-sm text-destructive">{fields.password.errors}</p>}
            </div>
            <Button type="submit" className="w-full">Crear usuario</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
