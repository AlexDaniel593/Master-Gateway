'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { modulesApi, rolesApi } from '@/lib/api';
import type { Modulo, Rol } from '@/lib/types';
import { ArrowLeft, Loader2, Puzzle, Link as LinkIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const [mod, setMod] = useState<Modulo | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [modRes, rolesRes] = await Promise.all([
        modulesApi.findOne(params.id as string),
        rolesApi.findAll(),
      ]);
      setMod(modRes.data);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Error al cargar datos');
      router.push('/dashboard/modules');
    } finally {
      setLoading(false);
    }
  };

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleUpdate = async () => {
    try {
      await modulesApi.update(params.id as string, {
        nombre: nombre || undefined,
        descripcion: descripcion || undefined,
      });
      toast.success('Módulo actualizado');
      router.push('/dashboard/modules');
    } catch {
      toast.error('Error al actualizar módulo');
    }
  };

  const assignToRole = async () => {
    if (!selectedRoleId) return;
    try {
      await modulesApi.asignarARol(selectedRoleId, params.id as string);
      toast.success('Módulo asignado al rol');
      setSelectedRoleId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al asignar');
    }
  };

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
          <CardTitle>Editar módulo: {mod?.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" defaultValue={mod?.nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" defaultValue={mod?.descripcion} onChange={(e) => setDescripcion(e.target.value)} />
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
                  .filter((r) => r.estado === 'ACTIVO')
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
    </div>
  );
}
