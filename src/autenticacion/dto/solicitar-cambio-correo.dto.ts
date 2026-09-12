import { IsEmail, IsString, MinLength } from 'class-validator';

export class SolicitarCambioCorreoDto {
  @IsEmail()
  nuevoCorreo: string;

  @IsString()
  @MinLength(8)
  password: string;
}
