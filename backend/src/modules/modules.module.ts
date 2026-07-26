import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesController, RolModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { Modulo } from './entities/modulo.entity';
import { RolModulo } from './entities/rol-modulo.entity';
import { Rol } from '../roles/entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo, RolModulo, Rol])],
  controllers: [ModulesController, RolModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
