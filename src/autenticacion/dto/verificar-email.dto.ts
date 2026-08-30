import { IsString } from 'class-validator';

export class VerificarEmailDto {
  @IsString()
  token: string;
}
