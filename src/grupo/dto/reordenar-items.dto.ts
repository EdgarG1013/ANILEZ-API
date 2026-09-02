import { IsArray, IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemOrden {
  @IsString()
  @IsNotEmpty()
  medio: string;

  @IsString()
  @IsNotEmpty()
  tenraiId: string;
}

export class ReordenarItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemOrden)
  items: ItemOrden[];
}
