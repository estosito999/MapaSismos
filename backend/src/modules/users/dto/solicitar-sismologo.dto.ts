import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SolicitarSismologoDto {
  @IsNotEmpty({ message: 'El número de acreditación o matrícula es obligatorio' })
  @IsString()
  @MaxLength(100)
  numeroAcreditacion: string;

  @IsNotEmpty({ message: 'La institución acreditadora es obligatoria' })
  @IsString()
  @MaxLength(100)
  institucionAcreditadora: string;
}
