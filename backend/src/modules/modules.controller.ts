import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { AsignarModuloRolDto } from './dto/asignar-modulo-rol.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('api/modules')
export class ModulesController {
  constructor(private modulesService: ModulesService) {}

  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateModuloDto, @CurrentUserId() userId: string) {
    return this.modulesService.create(dto, userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModuloDto, @CurrentUserId() userId: string) {
    return this.modulesService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.modulesService.remove(id, userId);
  }
}

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('api/roles/:rolId/modules')
export class RolModulesController {
  constructor(private modulesService: ModulesService) {}

  @Post()
  asignar(@Param('rolId') rolId: string, @Body() dto: AsignarModuloRolDto, @CurrentUserId() userId: string) {
    return this.modulesService.asignarARol(rolId, dto.moduloId, userId);
  }
}
