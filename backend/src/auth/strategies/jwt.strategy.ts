import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    rolId: string;
    rolNombre: string;
  }) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: payload.sub, estado: 'ACTIVO' },
    });
    if (!usuario)
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    return {
      userId: payload.sub,
      email: payload.email,
      rolId: payload.rolId,
      rolNombre: payload.rolNombre,
    };
  }
}
