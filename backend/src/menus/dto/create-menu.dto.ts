import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsUUID()
  moduloId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
