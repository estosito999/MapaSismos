import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSismoDto {
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

  @IsISO8601({}, { message: 'La versión del evento debe tener formato ISO 8601' })
  fechaUltimaActualizacion: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha y hora de origen debe tener formato ISO 8601' })
  @Matches(/Z$/, { message: 'La fecha y hora de origen debe expresarse en UTC' })
  fechaHoraUtc?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La magnitud debe tener máximo 2 decimales' })
  @Min(-2)
  @Max(10)
  magnitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tipo de magnitud debe ser un identificador entero' })
  @Min(1)
  idTipoMagnitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La profundidad debe tener máximo 2 decimales' })
  @Min(0)
  profundidadKm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'La latitud debe tener máximo 6 decimales' })
  @Min(-90)
  @Max(90)
  latitud?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 }, { message: 'La longitud debe tener máximo 6 decimales' })
  @Min(-180)
  @Max(180)
  longitud?: number;

  @IsOptional()
  @IsString({ message: 'La ubicación de referencia debe ser texto' })
  @Matches(/\S/, { message: 'La ubicación de referencia no puede estar vacía' })
  @MaxLength(255)
  observacionReferencia?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La fuente debe ser un identificador entero' })
  @Min(1)
  idFuente?: number;

  @IsOptional()
  @IsString({ message: 'El identificador externo debe ser texto' })
  @MaxLength(255)
  identificadorExterno?: string;

  @IsOptional()
  @IsBoolean({ message: 'La confirmación de duplicidad debe ser booleana' })
  confirmarPosibleDuplicado?: boolean;
}
