import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenusService } from './menus.service';
import { Menu } from './entities/menu.entity';
import { RolMenu } from './entities/rol-menu.entity';
import { Rol } from '../roles/entities/rol.entity';
import { Modulo } from '../modules/entities/modulo.entity';

describe('MenusService', () => {
  let menusService: MenusService;
  let menuRepo: Repository<Menu>;
  let rolMenuRepo: Repository<RolMenu>;
  let rolRepo: Repository<Rol>;
  let moduloRepo: Repository<Modulo>;

  const mockModulo = { id: 'uuid-mod-1', nombre: 'Seguridad', estado: 'ACTIVO' };
  const mockRol = { id: 'uuid-rol-1', nombre: 'ADMIN', estado: 'ACTIVO' };
  const mockMenu = {
    id: 'uuid-menu-1',
    nombre: 'Usuarios',
    url: '/users',
    estado: 'ACTIVO',
    modulo: mockModulo,
    padre: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenusService,
        {
          provide: getRepositoryToken(Menu),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RolMenu),
          useValue: {
            find: jest.fn(),
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
        {
          provide: getRepositoryToken(Modulo),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    menusService = module.get<MenusService>(MenusService);
    menuRepo = module.get<Repository<Menu>>(getRepositoryToken(Menu));
    rolMenuRepo = module.get<Repository<RolMenu>>(getRepositoryToken(RolMenu));
    rolRepo = module.get<Repository<Rol>>(getRepositoryToken(Rol));
    moduloRepo = module.get<Repository<Modulo>>(getRepositoryToken(Modulo));
  });

  describe('findAll', () => {
    it('should return all active menus with relations', async () => {
      const menus = [
        { ...mockMenu, id: 'uuid-1', nombre: 'Usuarios' },
        { ...mockMenu, id: 'uuid-2', nombre: 'Roles' },
      ];
      jest.spyOn(menuRepo, 'find').mockResolvedValue(menus as any);

      const result = await menusService.findAll();

      expect(result).toHaveLength(2);
      expect(menuRepo.find).toHaveBeenCalledWith({
        where: { estado: 'ACTIVO' },
        relations: { modulo: true, padre: true },
      });
    });
  });

  describe('getTree', () => {
    it('should return an empty array when no menus assigned to rol', async () => {
      jest.spyOn(rolMenuRepo, 'find').mockResolvedValue([]);

      const result = await menusService.getTree('uuid-rol-1');

      expect(result).toEqual([]);
    });

    it('should return a tree structure of menus', async () => {
      const mockRolMenus = [
        { menu: { id: 'uuid-menu-1', modulo: mockModulo, padre: null } },
      ];
      jest.spyOn(rolMenuRepo, 'find').mockResolvedValue(mockRolMenus as any);
      jest.spyOn(menuRepo, 'query').mockResolvedValue([
        { id: 'uuid-menu-1', nombre: 'Usuarios', url: '/users', parent_id: null, modulo_id: 'uuid-mod-1' },
      ]);

      const result = await menusService.getTree('uuid-rol-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a menu', async () => {
      const createDto = {
        nombre: 'Nuevo Menu',
        url: '/new-menu',
        moduloId: 'uuid-mod-1',
      };

      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(mockModulo as any);
      jest.spyOn(menuRepo, 'create').mockReturnValue(mockMenu as any);
      jest.spyOn(menuRepo, 'save').mockResolvedValue(mockMenu as any);

      const result = await menusService.create(createDto, 'admin-uuid');

      expect(result).toHaveProperty('nombre', 'Usuarios');
    });

    it('should throw NotFoundException when modulo not found', async () => {
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(null);

      await expect(
        menusService.create(
          { nombre: 'Test', moduloId: 'non-existent-mod' },
          'admin-uuid',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when parent menu not found', async () => {
      jest.spyOn(moduloRepo, 'findOne').mockResolvedValue(mockModulo as any);
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(null);

      await expect(
        menusService.create(
          { nombre: 'Test', moduloId: 'uuid-mod-1', parentId: 'non-existent-parent' },
          'admin-uuid',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a menu', async () => {
      const updateDto = { nombre: 'Updated Menu' };
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(mockMenu as any);
      jest.spyOn(menuRepo, 'save').mockResolvedValue({
        ...mockMenu,
        nombre: 'Updated Menu',
      } as any);

      const result = await menusService.update('uuid-menu-1', updateDto, 'admin-uuid');

      expect(result).toHaveProperty('nombre', 'Updated Menu');
    });

    it('should throw NotFoundException when menu not found', async () => {
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(null);

      await expect(
        menusService.update('non-existent-id', { nombre: 'test' }, 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when setting self as parent', async () => {
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(mockMenu as any);

      await expect(
        menusService.update('uuid-menu-1', { parentId: 'uuid-menu-1' }, 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a menu', async () => {
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(mockMenu as any);
      jest.spyOn(menuRepo, 'save').mockResolvedValue({
        ...mockMenu,
        estado: 'INACTIVO',
      } as any);

      const result = await menusService.remove('uuid-menu-1', 'admin-uuid');

      expect(result).toEqual({ message: 'Menú eliminado lógicamente' });
    });

    it('should throw NotFoundException when menu not found', async () => {
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(null);

      await expect(
        menusService.remove('non-existent-id', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('asignarARol', () => {
    it('should assign a menu to a rol', async () => {
      const mockRolMenu = { id: 'uuid-rm-1', rol: mockRol, menu: mockMenu };

      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(mockMenu as any);
      jest.spyOn(rolMenuRepo, 'create').mockReturnValue(mockRolMenu as any);
      jest.spyOn(rolMenuRepo, 'save').mockResolvedValue(mockRolMenu as any);

      const result = await menusService.asignarARol(
        'uuid-rol-1',
        'uuid-menu-1',
        'admin-uuid',
      );

      expect(result).toHaveProperty('id', 'uuid-rm-1');
    });

    it('should throw NotFoundException when rol not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(null);

      await expect(
        menusService.asignarARol('non-existent-rol', 'uuid-menu-1', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when menu not found', async () => {
      jest.spyOn(rolRepo, 'findOne').mockResolvedValue(mockRol as any);
      jest.spyOn(menuRepo, 'findOne').mockResolvedValue(null);

      await expect(
        menusService.asignarARol('uuid-rol-1', 'non-existent-menu', 'admin-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
