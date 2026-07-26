import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { RolMenu } from './entities/rol-menu.entity';
import { Rol } from '../roles/entities/rol.entity';
import { Modulo } from '../modules/entities/modulo.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private menuRepo: Repository<Menu>,
    @InjectRepository(RolMenu)
    private rolMenuRepo: Repository<RolMenu>,
    @InjectRepository(Rol)
    private rolRepo: Repository<Rol>,
    @InjectRepository(Modulo)
    private moduloRepo: Repository<Modulo>,
  ) {}

  async getTree(rolId: string) {
    const rolMenus = await this.rolMenuRepo.find({
      where: { rol: { id: rolId }, menu: { estado: 'ACTIVO' } },
      relations: { menu: { modulo: true, padre: true } },
    });

    const menuIds = rolMenus.map((rm) => rm.menu.id);
    if (menuIds.length === 0) return [];

    const query = `
      WITH RECURSIVE menu_tree AS (
        SELECT * FROM menus
        WHERE id IN (${menuIds.map((_, i) => `$${i + 1}`).join(',')})
          AND estado = 'ACTIVO'
        UNION ALL
        SELECT m.* FROM menus m
        INNER JOIN menu_tree mt ON m.id = mt.parent_id
        WHERE m.estado = 'ACTIVO'
      )
      SELECT DISTINCT * FROM menu_tree
    `;
    const flatMenus = await this.menuRepo.query(query, menuIds);

    return this.buildTree(flatMenus);
  }

  private buildTree(flatMenus: any[], parentId: string | null = null): any[] {
    return flatMenus
      .filter((m) => (m.parent_id || null) === parentId)
      .map((m) => ({
        id: m.id,
        nombre: m.nombre,
        url: m.url,
        moduloId: m.modulo_id,
        hijos: this.buildTree(flatMenus, m.id),
      }));
  }

  async create(dto: CreateMenuDto) {
    const modulo = await this.moduloRepo.findOne({
      where: { id: dto.moduloId, estado: 'ACTIVO' },
    });
    if (!modulo) throw new NotFoundException('Módulo no encontrado');

    let padre: Menu | null = null;
    if (dto.parentId) {
      padre = await this.menuRepo.findOne({
        where: { id: dto.parentId, estado: 'ACTIVO' },
      });
      if (!padre) throw new NotFoundException('Menú padre no encontrado');
    }

    const menu = this.menuRepo.create({
      nombre: dto.nombre,
      url: dto.url,
      modulo,
      padre,
    });
    return this.menuRepo.save(menu);
  }

  async update(id: string, dto: UpdateMenuDto) {
    const menu = await this.menuRepo.findOne({
      where: { id, estado: 'ACTIVO' },
      relations: { modulo: true, padre: true },
    });
    if (!menu) throw new NotFoundException('Menú no encontrado');

    if (dto.parentId) {
      if (dto.parentId === id)
        throw new NotFoundException('Un menú no puede ser su propio padre');
      const padre = await this.menuRepo.findOne({
        where: { id: dto.parentId },
      });
      if (!padre) throw new NotFoundException('Menú padre no encontrado');
      menu.padre = padre;
    }
    if (dto.moduloId) {
      const modulo = await this.moduloRepo.findOne({
        where: { id: dto.moduloId },
      });
      if (!modulo) throw new NotFoundException('Módulo no encontrado');
      menu.modulo = modulo;
    }
    if (dto.nombre) menu.nombre = dto.nombre;
    if (dto.url !== undefined) menu.url = dto.url;

    return this.menuRepo.save(menu);
  }

  async remove(id: string) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menú no encontrado');
    menu.estado = 'INACTIVO';
    await this.menuRepo.save(menu);
    return { message: 'Menú eliminado lógicamente' };
  }

  async asignarARol(rolId: string, menuId: string) {
    const rol = await this.rolRepo.findOne({
      where: { id: rolId, estado: 'ACTIVO' },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    const menu = await this.menuRepo.findOne({
      where: { id: menuId, estado: 'ACTIVO' },
    });
    if (!menu) throw new NotFoundException('Menú no encontrado');
    const rm = this.rolMenuRepo.create({ rol, menu });
    return this.rolMenuRepo.save(rm);
  }
}
