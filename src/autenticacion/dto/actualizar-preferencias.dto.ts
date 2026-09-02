import { IsBoolean, IsOptional } from 'class-validator';

export class ActualizarPreferenciasDto {
  @IsBoolean()
  @IsOptional()
  sfw?: boolean;
}
