import { IsEmail } from 'class-validator';

export class OlvidarContrasenaDto {
  @IsEmail()
  correo: string;
}
