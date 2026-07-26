import { IsUUID } from 'class-validator';

export class AsignarModuloRolDto {
  @IsUUID()
  moduloId: string;
}
