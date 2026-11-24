import { Type } from 'class-transformer';
import { IsISO8601, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PublicSismosQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  idMunicipio?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  idMacrodistrito?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pagina = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limite = 10;

  @IsOptional() @IsISO8601()
  fechaDesde?: string;

  @IsOptional() @IsISO8601()
  fechaHasta?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-2) @Max(10)
  magnitudMin?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-2) @Max(10)
  magnitudMax?: number;

  @IsOptional() @IsString() @MaxLength(100)
  ubicacion?: string;
}
