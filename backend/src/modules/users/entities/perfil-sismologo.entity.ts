import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('perfiles_sismologo')
export class PerfilSismologo {
  @PrimaryColumn({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'numero_acreditacion', length: 100 })
  numeroAcreditacion: string;

  @Column({ name: 'institucion_acreditadora', length: 100, nullable: true })
  institucionAcreditadora: string;

  @Column({ name: 'fecha_verificacion', type: 'date', nullable: true })
  fechaVerificacion: string;

  @Column({ default: true })
  vigente: boolean;

  @Column({ name: 'estado_solicitud', length: 50, default: 'APROBADA' })
  estadoSolicitud: string;

  @OneToOne(() => Usuario, (usuario) => usuario.perfilSismologo)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
