import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn } from 'class-validator';

export class AgregarItemGrupoDto {
  @IsString()
  @IsIn(['anime', 'manga'])
  medio: 'anime' | 'manga';

  @IsString()
  @IsNotEmpty()
  tenraiId: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  // Campos solo para items externos
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  img?: string;

  @IsOptional()
  @IsString()
  tipo?: string;
}
