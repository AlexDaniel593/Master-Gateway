import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModulesService } from './modules.service';
import { Modulo } from './entities/modulo.entity';
import { RolModulo } from './entities/rol-modulo.entity';
import { Rol } from '../roles/entities/rol.entity';

describe('ModulesService', () => {
  let modulesService: ModulesService;
  let moduloRepo: Repository<Modulo>;
  let rolModuloRepo: Repository<RolModulo>;
  let rolRepo: Repository<Rol>;

  const mockModulo = {
    id: 'uuid-mod-1',
    nombre: 'Seguridad',
    descripcion: 'Módulo de seguridad',
    estado: 'ACTIVO',
  };

  const mockRol = {
    id: 'uuid-rol-1',
    nombre: 'ADMIN',
    estado: 'ACTIVO',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        {
          provide: getRepositoryToken(Modulo),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RolModulo),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Rol),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    modulesService = module.get<ModulesService>(ModulesService);
    moduloRepo = module.get<Repository<Modulo>>(getRepositoryToken(Modulo));
    rolModuloRepo = module.get<Repository<RolModulo>>(
      getRepositoryToken(RolModulo),
    );
    rolRepo = module.get<Repository<Rol>>(getRepositoryToken(Rol));
  });

  describe('findAll', () => {
    it('should return all active modules ordered by name', async () => {
      const modules = [
        { ...mockModulo, id: 'uuid-1', nombre: 'Compras' },
        { ...mockModulo, id: 'uuid-2', nombre: 'Seguridad' },
      ];
      jest.spyOn(moduloRepo, 'find').mockResolvedValue(modules as any);

      const result = await modulesService.findAll();

      expect(result).toHaveLength(2);
      expect(moduloRepo.find).toHaveBeenCalledWith({
        where: { estado: 'ACTIVO' },
        order: { nombre: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a module by id', async () => {
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(mockModulo as any);

      const result = await modulesService.findOne('uuid-mod-1');

      expect(result).toHaveProperty('nombre', 'Seguridad');
    });

    it('should throw NotFoundException when module not found', async () => {
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(null);

      await expect(modulesService.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new module', async () => {
      const createDto = { nombre: 'Nuevo Modulo', descripcion: 'Descripción' };
      jest.spyOn(moduloRepo, 'create').mockReturnValue(mockModulo as any);
      jest.spyOn(moduloRepo, 'save').mockResolvedValue(mockModulo as any);

      const result = await modulesService.create(createDto, 'admin-uuid');

      expect(result).toHaveProperty('nombre', 'Seguridad');
      expect(moduloRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Nuevo Modulo' }),
      );
    });
  });

  describe('update', () => {
    it('should update an existing module', async () => {
      const updateDto = { descripcion: 'Updated desc' };
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(mockModulo as any);
      jest.spyOn(moduloRepo, 'save').mockResolvedValue({
        ...mockModulo,
        descripcion: 'Updated desc',
      } as any);

      const result = await modulesService.update(
        'uuid-mod-1',
        updateDto,
        'admin-uuid',
      );

      expect(result).toHaveProperty('descripcion', 'Updated desc');
    });

    it('should throw NotFoundException when module not found', async () => {
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(null);

      await expect(
        modulesService.update(
          'non-existent-id',
          { nombre: 'test' },
          'admin-uuid',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a module', async () => {
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(mockModulo as any);
      jest.spyOn(moduloRepo, 'save').mockResolvedValue({
        ...mockModulo,
        estado: 'INACTIVO',
      } as any);

      const result = await modulesService.remove('uuid-mod-1', 'admin-uuid');

      expect(result).toEqual({ message: 'Módulo eliminado lógicamente' });
    });

    it('should throw NotFoundException when module not found', async () => {
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(null);

      await expect(
        modulesService.remove('non-existent-id', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('asignarARol', () => {
    it('should assign a module to a role', async () => {
      const mockRolModulo = {
        id: 'uuid-rm-1',
        rol: mockRol,
        modulo: mockModulo,
      };

      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(mockModulo as any);
      jest.spyOn(rolModuloRepo, 'create').mockReturnValue(mockRolModulo as any);
      jest.spyOn(rolModuloRepo, 'save').mockResolvedValue(mockRolModulo as any);

      const result = await modulesService.asignarARol(
        'uuid-rol-1',
        'uuid-mod-1',
        'admin-uuid',
      );

      expect(result).toHaveProperty('id', 'uuid-rm-1');
    });

    it('should throw NotFoundException when rol not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(null);

      await expect(
        modulesService.asignarARol(
          'non-existent-rol',
          'uuid-mod-1',
          'admin-uuid',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when module not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(null);

      await expect(
        modulesService.asignarARol(
          'uuid-rol-1',
          'non-existent-mod',
          'admin-uuid',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
