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

@UseGuards(JwtAuthGuard)
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
  create(@Body() dto: CreateModuloDto) {
    return this.modulesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateModuloDto) {
    return this.modulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/roles/:rolId/modules')
export class RolModulesController {
  constructor(private modulesService: ModulesService) {}

  @Post()
  asignar(@Param('rolId') rolId: string, @Body() dto: AsignarModuloRolDto) {
    return this.modulesService.asignarARol(rolId, dto.moduloId);
  }
}
