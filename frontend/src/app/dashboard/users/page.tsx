'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { usersApi } from '@/lib/api';
import type { Usuario } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const columns = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'email', header: 'Email' },
  {
    key: 'estado',
    header: 'Estado',
    render: (u: Usuario) => (
      <Badge variant={u.estado === 'ACTIVO' ? 'default' : 'secondary'}>{u.estado}</Badge>
    ),
  },
  {
    key: 'fechaCreacion',
    header: 'Creado',
    render: (u: Usuario) => new Date(u.fechaCreacion).toLocaleDateString(),
  },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await usersApi.findAll(page);
      setUsers(data.data);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (user: Usuario) => {
    if (!confirm(`¿Eliminar al usuario ${user.nombre}?`)) return;
    try {
      await usersApi.remove(user.id);
      toast.success('Usuario eliminado');
      loadUsers();
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button onClick={() => router.push('/dashboard/users/new')}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable<Usuario>
            columns={columns}
            data={users}
            isLoading={isLoading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onEdit={(user) => router.push(`/dashboard/users/${user.id}/edit`)}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
