import { IsString } from 'class-validator';

export class ConfirmarCambioCorreoDto {
  @IsString()
  token: string;
}
