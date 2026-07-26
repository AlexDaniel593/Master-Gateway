'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { modulesApi } from '@/lib/api';
import type { Modulo } from '@/lib/types';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'descripcion', header: 'Descripción' },
  {
    key: 'estado',
    header: 'Estado',
    render: (m: Modulo) => (
      <Badge variant={m.estado === 'ACTIVO' ? 'default' : 'secondary'}>{m.estado}</Badge>
    ),
  },
];

export default function ModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<Modulo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const { data } = await modulesApi.findAll();
      setModules(data);
    } catch {
      toast.error('Error al cargar módulos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (mod: Modulo) => {
    if (!confirm(`¿Eliminar el módulo ${mod.nombre}?`)) return;
    try {
      await modulesApi.remove(mod.id);
      toast.success('Módulo eliminado');
      loadModules();
    } catch {
      toast.error('Error al eliminar módulo');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Módulos</h1>
        <Button onClick={() => router.push('/dashboard/modules/new')}>
          <Plus className="h-4 w-4" />
          Nuevo módulo
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable<Modulo>
            columns={columns}
            data={modules}
            isLoading={isLoading}
            onEdit={(mod) => router.push(`/dashboard/modules/${mod.id}/edit`)}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
