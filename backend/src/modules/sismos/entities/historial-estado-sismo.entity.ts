import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';
import { EstadoSismo } from './estado-sismo.entity';
import { Sismo } from './sismo.entity';

@Entity('historial_estados_sismo')
export class HistorialEstadoSismo {
  @PrimaryGeneratedColumn({ name: 'id_historial_estado' })
  idHistorialEstado: number;

  @Column({ name: 'id_sismo' })
  idSismo: number;

  @Column({ name: 'id_estado_sismo' })
  idEstadoSismo: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'fecha_estado', type: 'timestamp', default: () => 'NOW()' })
  fechaEstado: Date;

  @Column({ length: 500, nullable: true })
  observacion: string;

  @ManyToOne(() => Sismo, (sismo) => sismo.historialEstados, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_sismo' })
  sismo: Sismo;

  @ManyToOne(() => EstadoSismo, (estado) => estado.historialEstados)
  @JoinColumn({ name: 'id_estado_sismo' })
  estado: EstadoSismo;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
