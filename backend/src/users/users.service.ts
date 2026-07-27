import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.usuarioRepo.findAndCount({
      where: { estado: 'ACTIVO' },
      skip: (page - 1) * limit,
      take: limit,
      order: { fechaCreacion: 'DESC' },
    });
    const usuarios = data.map(({ passwordHash: _ph, ...u }) => u);
    return {
      data: usuarios,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id, estado: 'ACTIVO' },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const { passwordHash: _ph, ...result } = usuario;
    return result;
  }

  async create(dto: CreateUsuarioDto, userId: string) {
    const hash = await argon2.hash(dto.password);
    const usuario = this.usuarioRepo.create({
      ...dto,
      passwordHash: hash,
      creadoPor: userId,
      actualizadoPor: userId,
    });
    const saved = await this.usuarioRepo.save(usuario);
    const { passwordHash: _ph, ...result } = saved;
    return result;
  }

  async update(id: string, dto: UpdateUsuarioDto, userId: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id, estado: 'ACTIVO' },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const updateData: Record<string, any> = { ...dto };
    if (dto.password) {
      updateData.passwordHash = await argon2.hash(dto.password);
    }
    delete updateData.password;
    Object.assign(usuario, updateData);
    usuario.actualizadoPor = userId;
    const saved = await this.usuarioRepo.save(usuario);
    const { passwordHash: _ph, ...result } = saved;
    return result;
  }

  async remove(id: string, userId: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.estado = 'INACTIVO';
    usuario.actualizadoPor = userId;
    await this.usuarioRepo.save(usuario);
    return { message: 'Usuario eliminado lógicamente' };
  }
}
