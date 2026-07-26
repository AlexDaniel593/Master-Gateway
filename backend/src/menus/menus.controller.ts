import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { AsignarMenuRolDto } from './dto/asignar-menu-rol.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/menus')
export class MenusController {
  constructor(private menusService: MenusService) {}

  @Get('tree')
  getTree(@Request() req: any) {
    return this.menusService.getTree(req.user.rolId);
  }

  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menusService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menusService.remove(id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/roles/:rolId/menus')
export class RolMenusController {
  constructor(private menusService: MenusService) {}

  @Post()
  asignar(@Param('rolId') rolId: string, @Body() dto: AsignarMenuRolDto) {
    return this.menusService.asignarARol(rolId, dto.menuId);
  }
}
