import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CrearListaGrupoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsOptional()
  @IsNumber()
  orden?: number;
}
