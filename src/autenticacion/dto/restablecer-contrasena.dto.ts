import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RestablecerContrasenaDto {
  @IsEmail()
  correo: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password: string;
}
