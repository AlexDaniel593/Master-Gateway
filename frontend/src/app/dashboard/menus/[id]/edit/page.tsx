'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { menusApi, rolesApi } from '@/lib/api';
import { ArrowLeft, Loader2, Link as LinkIcon, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Menu, Rol } from '@/lib/types';

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menuRes, rolesRes] = await Promise.all([
        menusApi.findOne(params.id as string),
        rolesApi.findAll(),
      ]);
      setMenu(menuRes.data);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Error al cargar datos');
      router.push('/dashboard/menus');
    } finally {
      setLoading(false);
    }
  };

  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');

  const handleUpdate = async () => {
    try {
      await menusApi.update(params.id as string, {
        nombre: nombre || undefined,
        url: url || undefined,
      });
      toast.success('Menú actualizado');
      router.push('/dashboard/menus');
    } catch {
      toast.error('Error al actualizar menú');
    }
  };

  const assignToRole = async () => {
    if (!selectedRoleId) return;
    try {
      await menusApi.asignarARol(selectedRoleId, params.id as string);
      toast.success('Menú asignado al rol');
      setSelectedRoleId('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al asignar');
    }
  };

  const removeFromRole = async (rolId: string) => {
    try {
      await menusApi.desasignarARol(rolId, params.id as string);
      toast.success('Rol desasignado del menú');
      loadData();
    } catch {
      toast.error('Error al desasignar rol');
    }
  };

  const assignedRoleIds = new Set(
    menu?.rolMenus?.filter((rm) => rm.estado === 'ACTIVO').map((rm) => rm.rol.id) || [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar menú: {menu?.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" defaultValue={menu?.nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" defaultValue={menu?.url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Button onClick={handleUpdate} className="w-full">Guardar cambios</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asignar a rol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roles
                  .filter((r) => r.estado === 'ACTIVO' && !assignedRoleIds.has(r.id))
                  .map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={assignToRole} disabled={!selectedRoleId}>
              <LinkIcon className="h-4 w-4" />
              Asignar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles asignados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {menu?.rolMenus?.filter((rm) => rm.estado === 'ACTIVO').length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin roles asignados</p>
          ) : (
            menu?.rolMenus
              ?.filter((rm) => rm.estado === 'ACTIVO')
              .map((rm) => (
                <div
                  key={rm.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <p className="text-sm font-medium">{rm.rol.nombre}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromRole(rm.rol.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
