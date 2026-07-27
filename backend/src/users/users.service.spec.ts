import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { Usuario } from './entities/usuario.entity';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('UsersService', () => {
  let usersService: UsersService;
  let usuarioRepo: Repository<Usuario>;
  const argon2 = jest.requireMock('argon2');

  const mockUsuario = {
    id: 'uuid-user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    nombre: 'Test User',
    estado: 'ACTIVO',
    creadoPor: 'admin-uuid',
    actualizadoPor: 'admin-uuid',
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usuarioRepo = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users without passwordHash', async () => {
      const users = [
        { ...mockUsuario, id: 'uuid-1' },
        { ...mockUsuario, id: 'uuid-2' },
      ];
      jest.spyOn(usuarioRepo, 'findAndCount').mockResolvedValue([users as any, 2]);

      const result = await usersService.findAll(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data[0]).not.toHaveProperty('passwordHash');
    });

    it('should return empty data when no users exist', async () => {
      jest.spyOn(usuarioRepo, 'findAndCount').mockResolvedValue([[], 0]);

      const result = await usersService.findAll(1, 10);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return user without passwordHash', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);

      const result = await usersService.findOne('uuid-user-1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

      await expect(usersService.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create user, hash password, and return without passwordHash', async () => {
      const createDto = {
        email: 'new@test.com',
        password: 'password123',
        nombre: 'New User',
      };

      argon2.hash.mockResolvedValue('hashed-password');
      jest.spyOn(usuarioRepo, 'create').mockReturnValue(mockUsuario as any);
      jest.spyOn(usuarioRepo, 'save').mockResolvedValue(mockUsuario as any);

      const result = await usersService.create(createDto, 'admin-uuid');

      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('email', 'test@example.com');
    });
  });

  describe('update', () => {
    it('should update user and return without passwordHash', async () => {
      const updateDto = { nombre: 'Updated Name' };
      const updatedUser = { ...mockUsuario, nombre: 'Updated Name' };

      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);
      jest.spyOn(usuarioRepo, 'save').mockResolvedValue(updatedUser as any);

      const result = await usersService.update('uuid-user-1', updateDto, 'admin-uuid');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toHaveProperty('nombre', 'Updated Name');
    });

    it('should hash password when updating password', async () => {
      const updateDto = { password: 'new-password-123' };

      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);
      argon2.hash.mockResolvedValue('new-hashed-password');
      jest.spyOn(usuarioRepo, 'save').mockResolvedValue(mockUsuario as any);

      await usersService.update('uuid-user-1', updateDto, 'admin-uuid');

      expect(argon2.hash).toHaveBeenCalledWith('new-password-123');
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

      await expect(
        usersService.update('non-existent-id', { nombre: 'test' }, 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete user by setting estado to INACTIVO', async () => {
      const inactiveUser = { ...mockUsuario, estado: 'INACTIVO' };

      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);
      jest.spyOn(usuarioRepo, 'save').mockResolvedValue(inactiveUser as any);

      const result = await usersService.remove('uuid-user-1', 'admin-uuid');

      expect(result).toEqual({ message: 'Usuario eliminado lógicamente' });
      expect(usuarioRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'INACTIVO' }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

      await expect(usersService.remove('non-existent-id', 'admin-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
