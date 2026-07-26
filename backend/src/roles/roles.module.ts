import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { Rol } from './entities/rol.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { Usuario } from '../users/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rol, UsuarioRol, Usuario])],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
