import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HistorialEstadoSismo } from './historial-estado-sismo.entity';
import { Sismo } from './sismo.entity';

@Entity('estados_sismo')
export class EstadoSismo {
  @PrimaryGeneratedColumn({ name: 'id_estado_sismo' })
  idEstadoSismo: number;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @OneToMany(() => Sismo, (sismo) => sismo.estado)
  sismos: Sismo[];

  @OneToMany(() => HistorialEstadoSismo, (historial) => historial.estado)
  historialEstados: HistorialEstadoSismo[];
}
