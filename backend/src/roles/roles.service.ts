import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { Usuario } from '../users/entities/usuario.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Rol)
    private rolRepo: Repository<Rol>,
    @InjectRepository(UsuarioRol)
    private usuarioRolRepo: Repository<UsuarioRol>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  async findAll() {
    return this.rolRepo.find({
      where: { estado: 'ACTIVO' },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string) {
    const rol = await this.rolRepo.findOne({
      where: { id, estado: 'ACTIVO' },
      relations: { usuarioRoles: { usuario: true } },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    return rol;
  }

  async create(dto: CreateRolDto) {
    const rol = this.rolRepo.create(dto);
    return this.rolRepo.save(rol);
  }

  async update(id: string, dto: UpdateRolDto) {
    const rol = await this.rolRepo.findOne({ where: { id, estado: 'ACTIVO' } });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    Object.assign(rol, dto);
    return this.rolRepo.save(rol);
  }

  async remove(id: string) {
    const rol = await this.rolRepo.findOne({ where: { id } });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    const usuariosActivos = await this.usuarioRolRepo.count({
      where: { rol: { id }, estado: 'ACTIVO' },
    });
    if (usuariosActivos > 0)
      throw new BadRequestException(
        'No se puede eliminar un rol con usuarios activos asignados',
      );
    rol.estado = 'INACTIVO';
    await this.rolRepo.save(rol);
    return { message: 'Rol eliminado lógicamente' };
  }

  async asignarUsuario(rolId: string, usuarioId: string) {
    const rol = await this.rolRepo.findOne({
      where: { id: rolId, estado: 'ACTIVO' },
    });
    if (!rol) throw new NotFoundException('Rol no encontrado');
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuarioId, estado: 'ACTIVO' },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const existente = await this.usuarioRolRepo.findOne({
      where: {
        usuario: { id: usuarioId },
        rol: { id: rolId },
        estado: 'ACTIVO',
      },
    });
    if (existente)
      throw new BadRequestException('El usuario ya tiene este rol asignado');
    const ur = this.usuarioRolRepo.create({ usuario, rol });
    return this.usuarioRolRepo.save(ur);
  }

  async desasignarUsuario(rolId: string, usuarioId: string) {
    const ur = await this.usuarioRolRepo.findOne({
      where: {
        usuario: { id: usuarioId },
        rol: { id: rolId },
        estado: 'ACTIVO',
      },
    });
    if (!ur) throw new NotFoundException('La asignación no existe');
    ur.estado = 'INACTIVO';
    await this.usuarioRolRepo.save(ur);
    return { message: 'Rol desasignado del usuario' };
  }
}
