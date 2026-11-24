import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  passwordActual: string;

  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La nueva contraseña debe contener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/, {
    message:
      'La nueva contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&.)',
  })
  passwordNuevo: string;

  @IsString({ message: 'Debe repetir la nueva contraseña' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es obligatoria' })
  repetirPassword: string;
}
