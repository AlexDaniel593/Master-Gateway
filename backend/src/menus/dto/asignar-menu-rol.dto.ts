import { IsUUID } from 'class-validator';

export class AsignarMenuRolDto {
  @IsUUID()
  menuId: string;
}
