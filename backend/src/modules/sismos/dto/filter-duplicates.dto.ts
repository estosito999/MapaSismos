import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class FilterDuplicatesDto {
  @IsOptional()
  @IsIn(
    ['Pendiente de revisión', 'Confirmado como distinto', 'Confirmado como duplicado', 'Descartado'],
    { message: 'El estado de revisión no es válido' },
  )
  estadoRevision?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite = 10;
}
