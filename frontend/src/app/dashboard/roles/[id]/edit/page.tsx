'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { rolesApi, usersApi } from '@/lib/api';
import type { Rol, Usuario } from '@/lib/types';
import { ArrowLeft, Loader2, UserPlus, UserX } from 'lucide-react';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const [rol, setRol] = useState<Rol | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolRes, usersRes] = await Promise.all([
        rolesApi.findOne(params.id as string),
        usersApi.findAll(1, 100),
      ]);
      setRol(rolRes.data);
      setUsers(usersRes.data.data);
    } catch {
      toast.error('Error al cargar datos');
      router.push('/dashboard/roles');
    } finally {
      setLoading(false);
    }
  };

  const assignUser = async () => {
    if (!selectedUserId) return;
    try {
      await rolesApi.asignarUsuario(params.id as string, selectedUserId);
      toast.success('Usuario asignado al rol');
      loadData();
      setSelectedUserId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al asignar usuario');
    }
  };

  const removeUser = async (userId: string) => {
    try {
      await rolesApi.desasignarUsuario(params.id as string, userId);
      toast.success('Usuario desasignado del rol');
      loadData();
    } catch {
      toast.error('Error al desasignar usuario');
    }
  };

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleUpdate = async () => {
    try {
      await rolesApi.update(params.id as string, {
        nombre: nombre || undefined,
        descripcion: descripcion || undefined,
      });
      toast.success('Rol actualizado');
      router.push('/dashboard/roles');
    } catch {
      toast.error('Error al actualizar rol');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const assignedUserIds = new Set(
    rol?.usuarioRoles?.filter((ur) => ur.estado === 'ACTIVO').map((ur) => ur.usuario.id) || [],
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar rol: {rol?.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" defaultValue={rol?.nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" defaultValue={rol?.descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <Button onClick={handleUpdate} className="w-full">Guardar cambios</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios asignados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter((u) => !assignedUserIds.has(u.id))
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={assignUser} disabled={!selectedUserId}>
              <UserPlus className="h-4 w-4" />
              Asignar
            </Button>
          </div>
          <div className="space-y-2">
            {rol?.usuarioRoles
              ?.filter((ur) => ur.estado === 'ACTIVO')
              .map((ur) => (
                <div
                  key={ur.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{ur.usuario.nombre}</p>
                    <p className="text-xs text-muted-foreground">{ur.usuario.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUser(ur.usuario.id)}
                  >
                    <UserX className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
