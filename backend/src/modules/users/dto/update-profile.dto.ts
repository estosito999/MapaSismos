import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  apellidos?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  correo?: string;

  @IsOptional()
  @IsString({ message: 'La CI debe ser una cadena de texto' })
  @MaxLength(20, { message: 'La CI no debe superar los 20 caracteres' })
  ci?: string;
}
