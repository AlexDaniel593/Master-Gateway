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
import { rolesApi, usersApi, modulesApi, menusApi } from '@/lib/api';
import type { Rol, Usuario, Modulo, Menu } from '@/lib/types';
import { ArrowLeft, Loader2, UserPlus, UserX, Puzzle, LayoutList, Trash2 } from 'lucide-react';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const [rol, setRol] = useState<Rol | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedModuloId, setSelectedModuloId] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolRes, usersRes, modulosRes, menusRes] = await Promise.all([
        rolesApi.findOne(params.id as string),
        usersApi.findAll(1, 100),
        modulesApi.findAll(),
        menusApi.findAll(),
      ]);
      setRol(rolRes.data);
      setUsers(usersRes.data.data);
      setModulos(modulosRes.data);
      setMenus(menusRes.data);
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

  const assignModule = async () => {
    if (!selectedModuloId) return;
    try {
      await modulesApi.asignarARol(params.id as string, selectedModuloId);
      toast.success('Módulo asignado al rol');
      loadData();
      setSelectedModuloId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al asignar módulo');
    }
  };

  const removeModule = async (moduloId: string) => {
    try {
      await modulesApi.desasignarARol(params.id as string, moduloId);
      toast.success('Módulo desasignado del rol');
      loadData();
    } catch {
      toast.error('Error al desasignar módulo');
    }
  };

  const assignMenu = async () => {
    if (!selectedMenuId) return;
    try {
      await menusApi.asignarARol(params.id as string, selectedMenuId);
      toast.success('Menú asignado al rol');
      loadData();
      setSelectedMenuId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al asignar menú');
    }
  };

  const removeMenu = async (menuId: string) => {
    try {
      await menusApi.desasignarARol(params.id as string, menuId);
      toast.success('Menú desasignado del rol');
      loadData();
    } catch {
      toast.error('Error al desasignar menú');
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

  const assignedModuloIds = new Set(
    rol?.rolModulos?.filter((rm) => rm.estado === 'ACTIVO').map((rm) => rm.modulo.id) || [],
  );

  const assignedMenuIds = new Set(
    rol?.rolMenus?.filter((rm) => rm.estado === 'ACTIVO').map((rm) => rm.menu.id) || [],
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

      <Card>
        <CardHeader>
          <CardTitle>Módulos asignados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedModuloId} onValueChange={setSelectedModuloId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar módulo" />
              </SelectTrigger>
              <SelectContent>
                {modulos
                  .filter((m) => m.estado === 'ACTIVO' && !assignedModuloIds.has(m.id))
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={assignModule} disabled={!selectedModuloId}>
              <Puzzle className="h-4 w-4" />
              Asignar
            </Button>
          </div>
          <div className="space-y-2">
            {rol?.rolModulos
              ?.filter((rm) => rm.estado === 'ACTIVO')
              .map((rm) => (
                <div
                  key={rm.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <p className="text-sm font-medium">{rm.modulo.nombre}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeModule(rm.modulo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menús asignados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar menú" />
              </SelectTrigger>
              <SelectContent>
                {menus
                  .filter((m) => m.estado === 'ACTIVO' && !assignedMenuIds.has(m.id))
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={assignMenu} disabled={!selectedMenuId}>
              <LayoutList className="h-4 w-4" />
              Asignar
            </Button>
          </div>
          <div className="space-y-2">
            {rol?.rolMenus
              ?.filter((rm) => rm.estado === 'ACTIVO')
              .map((rm) => (
                <div
                  key={rm.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <p className="text-sm font-medium">{rm.menu.nombre}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMenu(rm.menu.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
