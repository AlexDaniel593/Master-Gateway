'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { menusApi } from '@/lib/api';
import type { Menu } from '@/lib/types';
import { DataTable } from '@/components/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, ChevronRight, Loader2 } from 'lucide-react';

const columns = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'url', header: 'URL' },
  {
    key: 'parentId',
    header: 'Padre',
    render: (m: Menu) => m.parentId ? <Badge variant="outline">Submenú</Badge> : <Badge>Raíz</Badge>,
  },
  {
    key: 'estado',
    header: 'Estado',
    render: (m: Menu) => (
      <Badge variant={m.estado === 'ACTIVO' ? 'default' : 'secondary'}>{m.estado}</Badge>
    ),
  },
];

export default function MenusPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tree, setTree] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'table' | 'tree'>('tree');

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    setIsLoading(true);
    try {
      const [flatRes, treeRes] = await Promise.all([
        menusApi.findAll(),
        menusApi.getTree(),
      ]);
      setMenus(flatRes.data);
      setTree(treeRes.data);
    } catch {
      toast.error('Error al cargar menús');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (menu: Menu) => {
    if (!confirm(`¿Eliminar el menú ${menu.nombre}?`)) return;
    try {
      await menusApi.remove(menu.id);
      toast.success('Menú eliminado');
      loadMenus();
    } catch {
      toast.error('Error al eliminar menú');
    }
  };

  function renderTree(items: any[], level = 0): React.ReactNode {
    return items.map((item) => (
      <div key={item.id}>
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-accent rounded-md cursor-pointer text-sm"
          style={{ marginLeft: level * 20 }}
        >
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium">{item.nombre}</span>
          {item.url && (
            <span className="text-xs text-muted-foreground ml-auto">{item.url}</span>
          )}
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => router.push(`/dashboard/menus/${item.id}/edit`)}
            >
              <span className="text-xs">✏️</span>
            </Button>
          </div>
        </div>
        {item.hijos && item.hijos.length > 0 && renderTree(item.hijos, level + 1)}
      </div>
    ));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Menús</h1>
          <div className="flex border rounded-md overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${view === 'tree' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setView('tree')}
            >
              Árbol
            </button>
            <button
              className={`px-3 py-1 text-sm ${view === 'table' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setView('table')}
            >
              Tabla
            </button>
          </div>
        </div>
        <Button onClick={() => router.push('/dashboard/menus/new')}>
          <Plus className="h-4 w-4" />
          Nuevo menú
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : view === 'tree' ? (
        <Card>
          <CardContent className="p-4">{renderTree(tree)}</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable<Menu>
              columns={columns}
              data={menus}
              onEdit={(m) => router.push(`/dashboard/menus/${m.id}/edit`)}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
