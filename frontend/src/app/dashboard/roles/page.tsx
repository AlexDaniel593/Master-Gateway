'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { rolesApi } from '@/lib/api';
import type { Rol } from '@/lib/types';
import { Plus } from 'lucide-react';

const columns = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'descripcion', header: 'Descripción' },
  {
    key: 'estado',
    header: 'Estado',
    render: (r: Rol) => (
      <Badge variant={r.estado === 'ACTIVO' ? 'default' : 'secondary'}>{r.estado}</Badge>
    ),
  },
];

export default function RolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const { data } = await rolesApi.findAll();
      setRoles(data);
    } catch {
      toast.error('Error al cargar roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (rol: Rol) => {
    if (!confirm(`¿Eliminar el rol ${rol.nombre}?`)) return;
    try {
      await rolesApi.remove(rol.id);
      toast.success('Rol eliminado');
      loadRoles();
    } catch {
      toast.error('Error al eliminar rol');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles</h1>
        <Button onClick={() => router.push('/dashboard/roles/new')}>
          <Plus className="h-4 w-4" />
          Nuevo rol
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable<Rol>
            columns={columns}
            data={roles}
            isLoading={isLoading}
            onEdit={(rol) => router.push(`/dashboard/roles/${rol.id}/edit`)}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
