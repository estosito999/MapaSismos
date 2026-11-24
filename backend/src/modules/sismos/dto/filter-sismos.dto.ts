import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class FilterSismosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor o igual que 1' })
  pagina = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor o igual que 1' })
  @Max(100, { message: 'El límite no puede superar 100 registros' })
  limite = 10;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha inicial debe tener formato ISO 8601' })
  fechaDesde?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha final debe tener formato ISO 8601' })
  fechaHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La magnitud mínima debe ser numérica' })
  @Min(-2)
  @Max(10)
  magnitudMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La magnitud máxima debe ser numérica' })
  @Min(-2)
  @Max(10)
  magnitudMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tipo de magnitud debe ser un identificador entero' })
  @Min(1)
  idTipoMagnitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El estado debe ser un identificador entero' })
  @Min(1)
  idEstadoSismo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La fuente debe ser un identificador entero' })
  @Min(1)
  idFuente?: number;

  @IsOptional()
  @IsString({ message: 'La ubicación debe ser texto' })
  @MaxLength(100, { message: 'La búsqueda de ubicación no puede superar 100 caracteres' })
  ubicacion?: string;
}
