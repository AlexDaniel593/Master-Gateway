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
import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { AsignarUsuarioDto } from './dto/asignar-usuario.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRolDto) {
    return this.rolesService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRolDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/users')
  asignarUsuario(@Param('id') id: string, @Body() dto: AsignarUsuarioDto) {
    return this.rolesService.asignarUsuario(id, dto.usuarioId);
  }

  @Delete(':id/users/:userId')
  desasignarUsuario(@Param('id') id: string, @Param('userId') userId: string) {
    return this.rolesService.desasignarUsuario(id, userId);
  }
}
