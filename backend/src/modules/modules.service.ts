import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo } from './entities/modulo.entity';
import { RolModulo } from './entities/rol-modulo.entity';
import { Rol } from '../roles/entities/rol.entity';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Modulo)
    private moduloRepo: Repository<Modulo>,
    @InjectRepository(RolModulo)
    private rolModuloRepo: Repository<RolModulo>,
    @InjectRepository(Rol)
    private rolRepo: Repository<Rol>,
  ) {}

  async findAll() {
    return this.moduloRepo.find({
      where: { estado: 'ACTIVO' },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const modulo = await this.moduloRepo.findOne({
      where: { id, estado: 'ACTIVO' },
    });
    if (!modulo) throw new NotFoundException('Módulo no encontrado');
    return modulo;
  }

  async create(dto: CreateModuloDto) {
    const modulo = this.moduloRepo.create(dto);
    return this.moduloRepo.save(modulo);
  }

  async update(id: string, dto: UpdateModuloDto) {
    const modulo = await this.moduloRepo.findOne({
      where: { id, estado: 'ACTIVO' },
    });
    if (!modulo) throw new NotFoundException('Módulo no encontrado');
    Object.assign(modulo, dto);
    return this.moduloRepo.save(modulo);
  }

  async remove(id: string) {
    const modulo = await this.moduloRepo.findOne({ where: { id } });
    if (!modulo) throw new NotFoundException('Módulo no encontrado');
    modulo.estado = 'INACTIVO';
    await this.moduloRepo.save(modulo);
    return { message: 'Módulo eliminado lógicamente' };
  }

  async asignarARol(rolId: string, moduloId: string) {
    const rol = await this.rolRepo.findOne({
      where: { id: rolId, estado: 'ACTIVO' },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    const modulo = await this.moduloRepo.findOne({
      where: { id: moduloId, estado: 'ACTIVO' },
    });
    if (!modulo) throw new NotFoundException('Módulo no encontrado');
    const rm = this.rolModuloRepo.create({ rol, modulo });
    return this.rolModuloRepo.save(rm);
  }
}
