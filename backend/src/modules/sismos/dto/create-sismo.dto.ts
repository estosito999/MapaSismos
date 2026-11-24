import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSismoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El municipio debe ser un identificador entero' })
  @Min(1)
  idMunicipio?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El macrodistrito debe ser un identificador entero' })
  @Min(1)
  idMacrodistrito?: number | null;

  @IsISO8601({}, { message: 'La fecha y hora de origen debe tener formato ISO 8601' })
  @Matches(/Z$/, { message: 'La fecha y hora de origen debe expresarse en UTC (terminar en Z)' })
  fechaHoraUtc: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'La magnitud debe ser numérica y tener como máximo 2 decimales' },
  )
  @Min(-2, { message: 'La magnitud no puede ser menor que -2' })
  @Max(10, { message: 'La magnitud no puede ser mayor que 10' })
  magnitud: number;

  @Type(() => Number)
  @IsInt({ message: 'El tipo de magnitud debe ser un identificador entero' })
  @Min(1, { message: 'El tipo de magnitud es obligatorio' })
  idTipoMagnitud: number;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'La profundidad debe ser numérica y tener como máximo 2 decimales' },
  )
  @Min(0, { message: 'La profundidad no puede ser negativa' })
  profundidadKm: number;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 6 },
    { message: 'La latitud debe ser numérica y tener como máximo 6 decimales' },
  )
  @Min(-90, { message: 'La latitud debe ser mayor o igual que -90' })
  @Max(90, { message: 'La latitud debe ser menor o igual que 90' })
  latitud: number;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 6 },
    { message: 'La longitud debe ser numérica y tener como máximo 6 decimales' },
  )
  @Min(-180, { message: 'La longitud debe ser mayor o igual que -180' })
  @Max(180, { message: 'La longitud debe ser menor o igual que 180' })
  longitud: number;

  @IsString({ message: 'La ubicación de referencia debe ser texto' })
  @IsNotEmpty({ message: 'La ubicación de referencia es obligatoria' })
  @Matches(/\S/, { message: 'La ubicación de referencia no puede estar vacía' })
  @MaxLength(255, { message: 'La ubicación de referencia no puede superar 255 caracteres' })
  observacionReferencia: string;

  @Type(() => Number)
  @IsInt({ message: 'La fuente debe ser un identificador entero' })
  @Min(1, { message: 'La fuente es obligatoria' })
  idFuente: number;

  @IsOptional()
  @IsString({ message: 'El identificador externo debe ser texto' })
  @MaxLength(255, { message: 'El identificador externo no puede superar 255 caracteres' })
  identificadorExterno?: string;

  @IsOptional()
  @IsBoolean({ message: 'La confirmación de duplicidad debe ser un valor booleano' })
  confirmarPosibleDuplicado?: boolean;
}
