'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { rolesApi } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
});

export default function NewRolePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: async (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      const formData = new FormData(event.currentTarget);
      setIsSubmitting(true);
      try {
        await rolesApi.create({
          nombre: formData.get('nombre') as string,
          descripcion: (formData.get('descripcion') as string) || undefined,
        });
        toast.success('Rol creado');
        router.push('/dashboard/roles');
      } catch {
        toast.error('Error al crear rol');
        setIsSubmitting(false);
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
          <CardTitle>Nuevo rol</CardTitle>
        </CardHeader>
        <CardContent>
          <form id={form.id} onSubmit={form.onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del rol</Label>
              <Input id="nombre" name="nombre" placeholder="Ej: ADMIN" required />
              {fields.nombre.errors && <p className="text-sm text-destructive">{fields.nombre.errors}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" name="descripcion" placeholder="Descripción del rol" />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear rol'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
