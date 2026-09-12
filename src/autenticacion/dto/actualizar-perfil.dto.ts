import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ActualizarPerfilDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9]+$/, {
    message: 'El nombre solo puede contener letras y numeros',
  })
  nombre: string;
}
