import { IsString, MinLength, Matches } from 'class-validator';

export class EstablecerContrasenaDto {
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contrasena debe contener al menos una mayuscula, una minuscula y un numero',
  })
  password: string;
}
