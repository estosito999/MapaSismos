import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';
import { Macrodistrito } from './macrodistrito.entity';

@Entity('suscripciones_alerta')
export class SuscripcionAlerta {
  @PrimaryGeneratedColumn({ name: 'id_suscripcion' })
  idSuscripcion: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'id_macrodistrito' })
  idMacrodistrito: number;

  @Column({ default: true })
  activa: boolean;

  @CreateDateColumn({ name: 'fecha_suscripcion' })
  fechaSuscripcion: Date;

  @ManyToOne(() => Usuario, (usuario) => usuario.suscripciones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Macrodistrito, (macro) => macro.suscripciones, { eager: true })
  @JoinColumn({ name: 'id_macrodistrito' })
  macrodistrito: Macrodistrito;
}
