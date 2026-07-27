export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioRoles?: UsuarioRol[];
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  usuarioRoles?: UsuarioRol[];
  rolModulos?: RolModulo[];
  rolMenus?: RolMenu[];
}

export interface Modulo {
  id: string;
  nombre: string;
  descripcion?: string;
  estado: string;
  menus?: Menu[];
}

export interface Menu {
  id: string;
  nombre: string;
  url?: string;
  estado: string;
  moduloId: string;
  parentId?: string;
  hijos?: Menu[];
}

export interface MenuTree {
  id: string;
  nombre: string;
  url?: string;
  moduloId: string;
  hijos: MenuTree[];
}

export interface UsuarioRol {
  id: string;
  usuario: Usuario;
  rol: Rol;
  estado: string;
}

export interface RolModulo {
  id: string;
  rol: Rol;
  modulo: Modulo;
}

export interface RolMenu {
  id: string;
  rol: Rol;
  menu: Menu;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  tempToken: string;
  roles: { id: string; nombre: string }[];
  user: { id: string; email: string; nombre: string };
}

export interface SelectRoleResponse {
  accessToken: string;
  refreshToken: string;
  rol: { id: string; nombre: string };
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId?: string;
  rolId?: string;
}
