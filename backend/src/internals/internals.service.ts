import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../users/entities/usuario.entity';

@Injectable()
export class InternalsService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  async validateToken(userId: string, rolId: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId, estado: 'ACTIVO' },
      relations: { usuarioRoles: { rol: true } },
    });
    if (!usuario) return { valid: false };

    const tieneRol = usuario.usuarioRoles.some(
      (ur) => ur.rol.id === rolId && ur.rol.estado === 'ACTIVO',
    );
    if (!tieneRol) return { valid: false };

    return { valid: true, userId: usuario.id, rolId };
  }
}
