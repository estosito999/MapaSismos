import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean({ message: 'El estado debe ser un booleano (true o false)' })
  @IsNotEmpty({ message: 'El estado es requerido' })
  estado: boolean;
}
