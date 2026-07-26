'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authStore } from '@/lib/auth-store';
import { menuStore } from '@/lib/menu-store';
import { menusApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Shield,
  Puzzle,
  MenuIcon,
  LogOut,
  User,
  Settings,
  RefreshCw,
  Loader2,
} from 'lucide-react';

function MenuItem({
  item,
  level = 0,
  pathname,
}: {
  item: { id: string; nombre: string; url?: string; hijos: any[] };
  level: number;
  pathname: string;
}) {
  const hasChildren = item.hijos && item.hijos.length > 0;
  const isActive = pathname === item.url;

  if (hasChildren) {
    return (
      <div>
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent cursor-pointer',
          )}
        >
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span>{item.nombre}</span>
        </div>
        <div className="ml-4 border-l pl-2">
          {item.hijos.map((hijo) => (
            <MenuItem key={hijo.id} item={hijo} level={level + 1} pathname={pathname} />
          ))}
        </div>
      </div>
    );
  }

  const iconMap: Record<string, any> = {
    Dashboard: LayoutDashboard,
    Usuarios: User,
    Roles: Shield,
    Módulos: Puzzle,
    Menús: MenuIcon,
  };
  const Icon = iconMap[item.nombre] || LayoutDashboard;

  return (
    <Link
      href={item.url || '/'}
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.nombre}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const selectedRol = authStore((s) => s.selectedRol);
  const user = authStore((s) => s.user);
  const { menuTree, isLoading, setMenuTree, setLoading } = menuStore();

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const { data } = await menusApi.getTree();
      setMenuTree(data);
    } catch {
      setMenuTree([]);
    }
  };

  const handleLogout = () => {
    authStore.getState().logout();
    window.location.href = '/login';
  };

  const initials = user?.nombre
    ? user.nombre.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex items-center gap-2 border-b px-4 h-14 shrink-0">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-semibold">Master Gateway</span>
        {selectedRol && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {selectedRol.nombre}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-1">
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
            pathname === '/dashboard'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent',
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-base">Dashboard</span>
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          menuTree.map((item) => (
            <MenuItem key={item.id} item={item} level={0} pathname={pathname} />
          ))
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium truncate max-w-[120px]">{user?.nombre || user?.email}</p>
              {user?.nombre && (
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={loadMenu}>
                <RefreshCw className="h-4 w-4" />
                Recargar menú
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
