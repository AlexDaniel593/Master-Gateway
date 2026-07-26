import { IsUUID } from 'class-validator';

export class AsignarUsuarioDto {
  @IsUUID()
  usuarioId: string;
}
