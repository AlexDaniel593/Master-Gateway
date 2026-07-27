import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolesService } from './roles.service';
import { Rol } from './entities/rol.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { Usuario } from '../users/entities/usuario.entity';

describe('RolesService', () => {
  let rolesService: RolesService;
  let rolRepo: Repository<Rol>;
  let usuarioRolRepo: Repository<UsuarioRol>;
  let usuarioRepo: Repository<Usuario>;

  const mockRol = {
    id: 'uuid-rol-1',
    nombre: 'ADMIN',
    descripcion: 'Administrator',
    estado: 'ACTIVO',
    usuarioRoles: [],
  };

  const mockUsuarioRol = {
    id: 'uuid-ur-1',
    estado: 'ACTIVO',
    usuario: { id: 'uuid-user-1', email: 'test@test.com', nombre: 'Test' },
    rol: mockRol,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Rol),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UsuarioRol),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    rolesService = module.get<RolesService>(RolesService);
    rolRepo = module.get<Repository<Rol>>(getRepositoryToken(Rol));
    usuarioRolRepo = module.get<Repository<UsuarioRol>>(getRepositoryToken(UsuarioRol));
    usuarioRepo = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  });

  describe('findAll', () => {
    it('should return all active roles ordered by name', async () => {
      const roles = [
        { ...mockRol, id: 'uuid-1', nombre: 'ADMIN' },
        { ...mockRol, id: 'uuid-2', nombre: 'USER' },
      ];
      jest.spyOn(rolRepo, 'find').mockResolvedValue(roles as any);

      const result = await rolesService.findAll();

      expect(result).toHaveLength(2);
      expect(rolRepo.find).toHaveBeenCalledWith({
        where: { estado: 'ACTIVO' },
        order: { nombre: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return rol with relations', async () => {
      const rolWithUsers = {
        ...mockRol,
        usuarioRoles: [mockUsuarioRol],
      };
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(rolWithUsers as any);

      const result = await rolesService.findOne('uuid-rol-1');

      expect(result).toHaveProperty('nombre', 'ADMIN');
      expect(result.usuarioRoles).toHaveLength(1);
    });

    it('should throw NotFoundException when rol not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(null);

      await expect(rolesService.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new rol', async () => {
      const createDto = { nombre: 'EDITOR', descripcion: 'Editor role' };
      jest.spyOn(rolRepo, 'create').mockReturnValue(mockRol as any);
      jest.spyOn(rolRepo, 'save').mockResolvedValue(mockRol as any);

      const result = await rolesService.create(createDto, 'admin-uuid');

      expect(result).toHaveProperty('nombre', 'ADMIN');
      expect(rolRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'EDITOR' }),
      );
    });
  });

  describe('update', () => {
    it('should update an existing rol', async () => {
      const updateDto = { descripcion: 'Updated description' };
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(rolRepo, 'save').mockResolvedValue({
        ...mockRol,
        descripcion: 'Updated description',
      } as any);

      const result = await rolesService.update('uuid-rol-1', updateDto, 'admin-uuid');

      expect(result).toHaveProperty('descripcion', 'Updated description');
    });

    it('should throw NotFoundException when rol not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(null);

      await expect(
        rolesService.update('non-existent-id', { nombre: 'test' }, 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a rol with no active users', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(usuarioRolRepo, 'count').mockResolvedValue(0);
      jest.spyOn(rolRepo, 'save').mockResolvedValue({ ...mockRol, estado: 'INACTIVO' } as any);

      const result = await rolesService.remove('uuid-rol-1', 'admin-uuid');

      expect(result).toEqual({ message: 'Rol eliminado lógicamente' });
    });

    it('should throw BadRequestException when rol has active users', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(usuarioRolRepo, 'count').mockResolvedValue(3);

      await expect(
        rolesService.remove('uuid-rol-1', 'admin-uuid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when rol not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(null);

      await expect(
        rolesService.remove('non-existent-id', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('asignarUsuario', () => {
    it('should assign a user to a rol', async () => {
      const mockUsuario = { id: 'uuid-user-1', email: 'user@test.com', estado: 'ACTIVO' };

      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);
      jest.spyOn(usuarioRolRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(usuarioRolRepo, 'create').mockReturnValue(mockUsuarioRol as any);
      jest.spyOn(usuarioRolRepo, 'save').mockResolvedValue(mockUsuarioRol as any);

      const result = await rolesService.asignarUsuario('uuid-rol-1', 'uuid-user-1', 'admin-uuid');

      expect(result).toHaveProperty('id', 'uuid-ur-1');
    });

    it('should throw NotFoundException when rol not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(null);

      await expect(
        rolesService.asignarUsuario('non-existent-rol', 'uuid-user-1', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when usuario not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

      await expect(
        rolesService.asignarUsuario('uuid-rol-1', 'non-existent-user', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user already has the rol', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue({ id: 'uuid-user-1' } as any);
      jest.spyOn(usuarioRolRepo, 'findOne').mockResolvedValue(mockUsuarioRol as any);

      await expect(
        rolesService.asignarUsuario('uuid-rol-1', 'uuid-user-1', 'admin-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('desasignarUsuario', () => {
    it('should soft-delete the user-rol assignment', async () => {
      jest.spyOn(usuarioRolRepo, 'findOne').mockResolvedValue(mockUsuarioRol as any);
      jest.spyOn(usuarioRolRepo, 'save').mockResolvedValue({
        ...mockUsuarioRol,
        estado: 'INACTIVO',
      } as any);

      const result = await rolesService.desasignarUsuario(
        'uuid-rol-1',
        'uuid-user-1',
        'admin-uuid',
      );

      expect(result).toEqual({ message: 'Rol desasignado del usuario' });
    });

    it('should throw NotFoundException when assignment not found', async () => {
      jest.spyOn(usuarioRolRepo, 'findOne').mockResolvedValue(null);

      await expect(
        rolesService.desasignarUsuario('uuid-rol-1', 'uuid-user-1', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
