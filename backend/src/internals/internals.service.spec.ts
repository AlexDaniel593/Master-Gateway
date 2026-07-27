import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalsService } from './internals.service';
import { Usuario } from '../users/entities/usuario.entity';

describe('InternalsService', () => {
  let internalsService: InternalsService;
  let usuarioRepo: Repository<Usuario>;

  const mockUsuario = {
    id: 'uuid-user-1',
    email: 'test@example.com',
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
        InternalsService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    internalsService = module.get<InternalsService>(InternalsService);
    usuarioRepo = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  });

  describe('validateToken', () => {
    it('should return valid true when user has the role', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);

      const result = await internalsService.validateToken(
        'uuid-user-1',
        'uuid-rol-1',
      );

      expect(result).toEqual({
        valid: true,
        userId: 'uuid-user-1',
        rolId: 'uuid-rol-1',
      });
    });

    it('should return valid false when user not found', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(null);

      const result = await internalsService.validateToken(
        'non-existent-id',
        'uuid-rol-1',
      );

      expect(result).toEqual({ valid: false });
    });

    it('should return valid false when user does not have the role', async () => {
      jest.spyOn(usuarioRepo, 'findOne').mockResolvedValue(mockUsuario as any);

      const result = await internalsService.validateToken(
        'uuid-user-1',
        'uuid-rol-2',
      );

      expect(result).toEqual({ valid: false });
    });

    it('should return valid false when the role is not active', async () => {
      const userWithInactiveRole = {
        ...mockUsuario,
        usuarioRoles: [
          {
            rol: { id: 'uuid-rol-1', nombre: 'ADMIN', estado: 'INACTIVO' },
          },
        ],
      };
      jest
        .spyOn(usuarioRepo, 'findOne')
        .mockResolvedValue(userWithInactiveRole as any);

      const result = await internalsService.validateToken(
        'uuid-user-1',
        'uuid-rol-1',
      );

      expect(result).toEqual({ valid: false });
    });
  });
});
