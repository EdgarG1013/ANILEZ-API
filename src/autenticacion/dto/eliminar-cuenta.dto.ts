import { IsString } from 'class-validator';

export class EliminarCuentaDto {
  @IsString()
  nombre: string;
}
