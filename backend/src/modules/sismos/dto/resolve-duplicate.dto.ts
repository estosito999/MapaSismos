import { IsIn, IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';

export class ResolveDuplicateDto {
  @IsIn(['Confirmado como distinto', 'Confirmado como duplicado', 'Descartado'], {
    message: 'La resolución seleccionada no es válida',
  })
  estadoRevision: string;

  @IsString({ message: 'La observación debe ser texto' })
  @IsNotEmpty({ message: 'La observación técnica es obligatoria' })
  @Matches(/\S/, { message: 'La observación técnica no puede estar vacía' })
  @MaxLength(300, { message: 'La observación no puede superar 300 caracteres' })
  observacion: string;
}
