import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateModuloDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
