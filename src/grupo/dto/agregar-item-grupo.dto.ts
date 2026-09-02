import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, IsObject } from 'class-validator';

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

  // Metadata del catálogo solo para items externos
  @IsOptional()
  @IsObject()
  datosCatalogo?: Record<string, unknown>;
}
