import { IsEmail, IsString, MinLength } from 'class-validator';

export class IniciarSesionDto {
  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(8)
  password: string;
}
