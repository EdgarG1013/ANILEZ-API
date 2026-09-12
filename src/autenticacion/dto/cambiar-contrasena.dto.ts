import { IsString, MinLength, Matches } from 'class-validator';

export class CambiarContrasenaDto {
  @IsString()
  @MinLength(8)
  contrasenaActual: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contrasena debe contener al menos una mayuscula, una minuscula y un numero',
  })
  nuevaContrasena: string;
}
