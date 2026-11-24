import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignRoleDto {
  @IsInt({ message: 'El ID de rol debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de rol es requerido' })
  idRol: number;

  @IsOptional()
  @IsString({ message: 'El número de acreditación debe ser texto' })
  numeroAcreditacion?: string;

  @IsOptional()
  @IsString({ message: 'La institución acreditadora debe ser texto' })
  institucionAcreditadora?: string;
}
