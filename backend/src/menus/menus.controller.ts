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
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/menus')
export class MenusController {
  constructor(private menusService: MenusService) {}

  @Get('tree')
  getTree(@Request() req: any) {
    return this.menusService.getTree(req.user.rolId);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.menusService.findAll();
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateMenuDto, @CurrentUserId() userId: string) {
    return this.menusService.create(dto, userId);
  }

  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateMenuDto, @CurrentUserId() userId: string) {
    return this.menusService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.menusService.remove(id, userId);
  }
}

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('api/roles/:rolId/menus')
export class RolMenusController {
  constructor(private menusService: MenusService) {}

  @Post()
  asignar(@Param('rolId') rolId: string, @Body() dto: AsignarMenuRolDto, @CurrentUserId() userId: string) {
    return this.menusService.asignarARol(rolId, dto.menuId, userId);
  }
}
