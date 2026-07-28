'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { menusApi, modulesApi } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Modulo, Menu } from '@/lib/types';

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  url: z.string().optional(),
  moduloId: z.string().min(1, 'Selecciona un módulo'),
  parentId: z.string().optional(),
});

export default function NewMenuPage() {
  const router = useRouter();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedModulo, setSelectedModulo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modRes, menuRes] = await Promise.all([
        modulesApi.findAll(),
        menusApi.findAll(),
      ]);
      setModulos(modRes.data.filter((m) => m.estado === 'ACTIVO'));
      setMenus(menuRes.data.filter((m) => m.estado === 'ACTIVO'));
    } catch {
      toast.error('Error al cargar datos');
    }
  };

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: async (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      const formData = new FormData(event.currentTarget);
      const submission = parseWithZod(formData, { schema });
      if (submission.status !== 'success') return submission;

      setIsSubmitting(true);
      try {
        await menusApi.create({
          nombre: formData.get('nombre') as string,
          url: (formData.get('url') as string) || undefined,
          moduloId: formData.get('moduloId') as string,
          parentId: (formData.get('parentId') as string) || undefined,
        });
        toast.success('Menú creado');
        router.push('/dashboard/menus');
      } catch {
        toast.error('Error al crear menú');
        setIsSubmitting(false);
      }
    },
  });

  const parentMenus = menus.filter((m) => m.moduloId === selectedModulo || !selectedModulo);

  return (
    <div className="space-y-4 max-w-md">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Nuevo menú</CardTitle>
        </CardHeader>
        <CardContent>
          <form id={form.id} onSubmit={form.onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del menú</Label>
              <Input id="nombre" name="nombre" placeholder="Ej: Dashboard" required />
              {fields.nombre.errors && <p className="text-sm text-destructive">{fields.nombre.errors}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL (dejar vacío si es agrupador)</Label>
              <Input id="url" name="url" placeholder="/dashboard" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moduloId">Módulo</Label>
              <Select
                name="moduloId"
                onValueChange={(v: string) => {
                  setSelectedModulo(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar módulo" />
                </SelectTrigger>
                <SelectContent>
                  {modulos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fields.moduloId.errors && <p className="text-sm text-destructive">{fields.moduloId.errors}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentId">Menú padre (opcional, para submenús)</Label>
              <Select name="parentId">
                <SelectTrigger>
                  <SelectValue placeholder="Ninguno (raíz)" />
                </SelectTrigger>
                <SelectContent>
                  {parentMenus.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear menú'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
