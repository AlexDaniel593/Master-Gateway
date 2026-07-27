import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { Usuario } from '../users/entities/usuario.entity';
import { UsuarioRol } from '../roles/entities/usuario-rol.entity';
import { LoginDto } from './dto/login.dto';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usuarioRepo: Repository<Usuario>;
  let usuarioRolRepo: Repository<UsuarioRol>;
  let jwtService: JwtService;

  const mockUsuario = {
    id: 'uuid-user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    nombre: 'Test User',
    estado: 'ACTIVO',
    usuarioRoles: [
      {
        rol: { id: 'uuid-rol-1', nombre: 'ADMIN', estado: 'ACTIVO' },
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UsuarioRol),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usuarioRepo = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
    usuarioRolRepo = module.get<Repository<UsuarioRol>>(
      getRepositoryToken(UsuarioRol),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tempToken and roles on valid credentials', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);
      (jest.requireMock('argon2').verify as jest.Mock).mockResolvedValue(true);

      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = await authService.login(dto);

      expect(result).toHaveProperty('tempToken');
      expect(result).toHaveProperty('roles');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({ id: 'uuid-user-1', email: 'test@example.com', nombre: 'Test User' });
      expect(result.roles).toEqual([{ id: 'uuid-rol-1', nombre: 'ADMIN' }]);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'notfound@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);
      (jest.requireMock('argon2').verify as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user has no active roles', async () => {
      const userWithoutRoles = {
        ...mockUsuario,
        usuarioRoles: [],
      };
      jest
        .spyOn(usuarioRepo, 'findOne')
        .mockResolvedValue(userWithoutRoles as any);
      (jest.requireMock('argon2').verify as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('selectRole', () => {
    it('should return access and refresh tokens on valid tempToken and role', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'uuid-user-1',
        email: 'test@example.com',
        type: 'temp',
      });
      jest.spyOn(usuarioRolRepo, 'findOne').mockResolvedValue({
        rol: { id: 'uuid-rol-1', nombre: 'ADMIN' },
      } as any);

      const result = await authService.selectRole({
        tempToken: 'valid-temp-token',
        roleId: 'uuid-rol-1',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.rol).toEqual({ id: 'uuid-rol-1', nombre: 'ADMIN' });
    });

    it('should throw UnauthorizedException when tempToken is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        authService.selectRole({
          tempToken: 'invalid-token',
          roleId: 'uuid-rol-1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when token is not temp type', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'uuid-user-1',
        type: 'refresh',
      });

      await expect(
        authService.selectRole({
          tempToken: 'refresh-token',
          roleId: 'uuid-rol-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user does not have the role', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'uuid-user-1',
        email: 'test@example.com',
        type: 'temp',
      });
      jest.spyOn(usuarioRolRepo, 'findOne').mockResolvedValue(null);

      await expect(
        authService.selectRole({
          tempToken: 'valid-temp-token',
          roleId: 'uuid-rol-2',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens on valid refresh token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'uuid-user-1',
        type: 'refresh',
      });
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when token is not refresh type', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'uuid-user-1',
        type: 'temp',
      });

      await expect(authService.refreshToken('temp-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: 'uuid-user-1',
        type: 'refresh',
      });
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

      await expect(
        authService.refreshToken('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should return a success message', () => {
      const result = authService.logout();

      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
    });
  });
});
