import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CrearGrupoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];
}
