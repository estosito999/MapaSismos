import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { RoleName } from '../../../common/constants/roles.constant';

export class CreateUserDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  apellidos: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  correo: string;

  @IsString({ message: 'La CI debe ser una cadena de texto' })
  @MaxLength(20, { message: 'La CI no debe superar los 20 caracteres' })
  ci: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  telefono?: string;

  @IsIn([RoleName.ADMINISTRADOR, RoleName.CIUDADANO, RoleName.SISMOLOGO], {
    message: 'El rol debe ser Administrador, Ciudadano o Sismólogo',
  })
  rol: string;

  @IsOptional()
  @IsString({ message: 'La matrícula debe ser una cadena de texto' })
  numeroAcreditacion?: string;

  @IsOptional()
  @IsString({ message: 'La institución debe ser una cadena de texto' })
  institucionAcreditadora?: string;
}
