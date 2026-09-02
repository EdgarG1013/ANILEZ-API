import { IsString, IsIn, IsOptional, IsArray, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class ActualizarListaDto {
  @IsOptional()
  @IsString()
  @IsIn(['viendo', 'leyendo', 'completado', 'por-ver', 'por-leer', 'pausado', 'descartado'])
  estado?: string;

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
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsNumber()
  orden?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];
}
