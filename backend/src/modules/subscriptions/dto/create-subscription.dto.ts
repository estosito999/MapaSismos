import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionDto {
  @IsInt({ message: 'El ID de macrodistrito debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de macrodistrito es requerido' })
  idMacrodistrito: number;
}
