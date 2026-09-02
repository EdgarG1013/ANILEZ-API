import { IsString, IsIn, IsNotEmpty, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class CrearListaDto {
  @IsString()
  @IsNotEmpty()
  tenraiId: string;

  @IsString()
  @IsIn(['anime', 'manga'])
  medio: 'anime' | 'manga';

  @IsString()
  @IsIn(['viendo', 'leyendo', 'completado', 'por-ver', 'por-leer', 'pausado', 'descartado'])
  estado: string;

  @IsOptional()
  @IsNumber()
  progreso?: number;

  @IsOptional()
  @IsBoolean()
  favorito?: boolean;

  @IsOptional()
  @IsNumber()
  puntuacion?: number;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];

  @IsOptional()
  @IsNumber()
  orden?: number;

  // Datos del catálogo (del frontend) para respaldo inicial
  @IsOptional()
  datosCatalogo?: Record<string, unknown>;
}
