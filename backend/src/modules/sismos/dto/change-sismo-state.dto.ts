import { Type } from 'class-transformer';
import { IsISO8601, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ChangeSismoStateDto {
  @Type(() => Number)
  @IsInt({ message: 'El estado debe ser un identificador entero' })
  @Min(1, { message: 'El estado seleccionado no es válido' })
  idEstadoSismo: number;

  @IsISO8601({}, { message: 'La versión del evento debe tener formato ISO 8601' })
  fechaUltimaActualizacion: string;

  @IsOptional()
  @IsString({ message: 'La observación debe ser texto' })
  @MaxLength(500, { message: 'La observación no puede superar 500 caracteres' })
  observacion?: string;
}
