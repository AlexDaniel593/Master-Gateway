import api from './api-client';
import type {
  Usuario,
  Rol,
  Modulo,
  Menu,
  MenuTree,
  PaginatedResponse,
  LoginResponse,
  SelectRoleResponse,
  RefreshResponse,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, password }),

  selectRole: (tempToken: string, roleId: string) =>
    api.post<SelectRoleResponse>('/api/auth/select-role', { tempToken, roleId }),

  refreshToken: (refreshToken: string) =>
    api.post<RefreshResponse>('/api/auth/refresh-token', { refreshToken }),

  logout: () => api.post('/api/auth/logout'),
};

export const usersApi = {
  findAll: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Usuario>>('/api/users', { params: { page, limit } }),

  findOne: (id: string) => api.get<Usuario>(`/api/users/${id}`),

  create: (data: { email: string; password: string; nombre: string }) =>
    api.post<Usuario>('/api/users', data),

  update: (id: string, data: { email?: string; nombre?: string; password?: string }) =>
    api.put<Usuario>(`/api/users/${id}`, data),

  remove: (id: string) => api.delete(`/api/users/${id}`),
};

export const rolesApi = {
  findAll: () => api.get<Rol[]>('/api/roles'),
  findOne: (id: string) => api.get<Rol>(`/api/roles/${id}`),
  create: (data: { nombre: string; descripcion?: string }) =>
    api.post<Rol>('/api/roles', data),
  update: (id: string, data: { nombre?: string; descripcion?: string }) =>
    api.put<Rol>(`/api/roles/${id}`, data),
  remove: (id: string) => api.delete(`/api/roles/${id}`),
  asignarUsuario: (rolId: string, usuarioId: string) =>
    api.post(`/api/roles/${rolId}/users`, { usuarioId }),
  desasignarUsuario: (rolId: string, usuarioId: string) =>
    api.delete(`/api/roles/${rolId}/users/${usuarioId}`),
};

export const modulesApi = {
  findAll: () => api.get<Modulo[]>('/api/modules'),
  findOne: (id: string) => api.get<Modulo>(`/api/modules/${id}`),
  create: (data: { nombre: string; descripcion?: string }) =>
    api.post<Modulo>('/api/modules', data),
  update: (id: string, data: { nombre?: string; descripcion?: string }) =>
    api.put<Modulo>(`/api/modules/${id}`, data),
  remove: (id: string) => api.delete(`/api/modules/${id}`),
  asignarARol: (rolId: string, moduloId: string) =>
    api.post(`/api/roles/${rolId}/modules`, { moduloId }),
};

export const menusApi = {
  getTree: () => api.get<MenuTree[]>('/api/menus/tree'),
  findAll: () => api.get<Menu[]>('/api/menus'),
  create: (data: { nombre: string; url?: string; moduloId: string; parentId?: string }) =>
    api.post<Menu>('/api/menus', data),
  update: (id: string, data: { nombre?: string; url?: string; moduloId?: string; parentId?: string }) =>
    api.put<Menu>(`/api/menus/${id}`, data),
  remove: (id: string) => api.delete(`/api/menus/${id}`),
  asignarARol: (rolId: string, menuId: string) =>
    api.post(`/api/roles/${rolId}/menus`, { menuId }),
};
