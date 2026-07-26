import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusController, RolMenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { Menu } from './entities/menu.entity';
import { RolMenu } from './entities/rol-menu.entity';
import { Rol } from '../roles/entities/rol.entity';
import { Modulo } from '../modules/entities/modulo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, RolMenu, Rol, Modulo])],
  controllers: [MenusController, RolMenusController],
  providers: [MenusService],
  exports: [MenusService],
})
export class MenusModule {}
