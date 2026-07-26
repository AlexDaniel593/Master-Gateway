import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { Usuario } from '../users/entities/usuario.entity';
import { UsuarioRol } from '../roles/entities/usuario-rol.entity';
import { LoginDto } from './dto/login.dto';
import { SelectRoleDto } from './dto/select-role.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
    @InjectRepository(UsuarioRol)
    private usuarioRolRepo: Repository<UsuarioRol>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { email: dto.email, estado: 'ACTIVO' },
      relations: { usuarioRoles: { rol: true } },
    });
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await argon2.verify(usuario.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const roles = usuario.usuarioRoles
      .filter((ur) => ur.rol.estado === 'ACTIVO')
      .map((ur) => ({ id: ur.rol.id, nombre: ur.rol.nombre }));

    if (roles.length === 0)
      throw new UnauthorizedException('El usuario no tiene roles activos');

    const tempToken = this.jwtService.sign(
      { sub: usuario.id, email: usuario.email, type: 'temp' },
      { expiresIn: '5m' as any },
    );

    return { tempToken, roles };
  }

  async selectRole(dto: SelectRoleDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.tempToken);
    } catch {
      throw new UnauthorizedException('TempToken inválido o expirado');
    }

    if (payload.type !== 'temp')
      throw new BadRequestException('Token no es temporal');

    const usuarioRol = await this.usuarioRolRepo.findOne({
      where: {
        usuario: { id: payload.sub, estado: 'ACTIVO' },
        rol: { id: dto.roleId, estado: 'ACTIVO' },
      },
      relations: { rol: true },
    });
    if (!usuarioRol)
      throw new BadRequestException('El usuario no tiene ese rol asignado');

    const accessToken = this.jwtService.sign(
      {
        sub: payload.sub,
        email: payload.email,
        rolId: usuarioRol.rol.id,
        rolNombre: usuarioRol.rol.nombre,
      },
      { expiresIn: '15m' as any },
    );

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub, type: 'refresh' },
      { expiresIn: '7d' as any },
    );

    return {
      accessToken,
      refreshToken,
      rol: { id: usuarioRol.rol.id, nombre: usuarioRol.rol.nombre },
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('RefreshToken inválido o expirado');
    }
    if (payload.type !== 'refresh')
      throw new BadRequestException('Token no es de refresco');

    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub, estado: 'ACTIVO' },
    });
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    const accessToken = this.jwtService.sign(
      { sub: usuario.id, email: usuario.email },
      { expiresIn: '15m' as any },
    );

    const newRefreshToken = this.jwtService.sign(
      { sub: usuario.id, type: 'refresh' },
      { expiresIn: '7d' as any },
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  logout() {
    return { message: 'Sesión cerrada exitosamente' };
  }
}
