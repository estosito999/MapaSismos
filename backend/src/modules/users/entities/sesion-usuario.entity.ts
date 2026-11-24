import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('sesiones_usuario')
export class SesionUsuario {
  @PrimaryGeneratedColumn({ name: 'id_sesion' })
  idSesion: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ length: 500 })
  token: string;

  @CreateDateColumn({ name: 'fecha_inicio' })
  fechaInicio: Date;

  @Column({ name: 'fecha_expiracion' })
  fechaExpiracion: Date;

  @Column({ default: false })
  revocada: boolean;

  @ManyToOne(() => Usuario, (usuario) => usuario.sesiones)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
