import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';
import { Sismo } from './sismo.entity';

@Entity('posibles_duplicados_sismo')
export class PosibleDuplicadoSismo {
  @PrimaryGeneratedColumn({ name: 'id_duplicidad' })
  idDuplicidad: number;

  @Column({ name: 'id_sismo_candidato' })
  idSismoCandidato: number;

  @Column({ name: 'id_sismo_coincidente' })
  idSismoCoincidente: number;

  @Column({ name: 'estado_revision', length: 100 })
  estadoRevision: string;

  @Column({ length: 500, nullable: true })
  observacion: string;

  @Column({ name: 'id_usuario_revision', nullable: true })
  idUsuarioRevision: number;

  @Column({ name: 'fecha_deteccion', type: 'timestamp', default: () => 'NOW()' })
  fechaDeteccion: Date;

  @Column({ name: 'fecha_resolucion', type: 'timestamp', nullable: true })
  fechaResolucion: Date;

  @ManyToOne(() => Sismo, (sismo) => sismo.duplicadosComoCandidato)
  @JoinColumn({ name: 'id_sismo_candidato' })
  sismoCandidato: Sismo;

  @ManyToOne(() => Sismo, (sismo) => sismo.duplicadosComoCoincidente)
  @JoinColumn({ name: 'id_sismo_coincidente' })
  sismoCoincidente: Sismo;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario_revision' })
  usuarioRevision: Usuario;
}
