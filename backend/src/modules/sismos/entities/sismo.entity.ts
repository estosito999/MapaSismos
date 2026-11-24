import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';
import { EstadoSismo } from './estado-sismo.entity';
import { HistorialCambioSismo } from './historial-cambio-sismo.entity';
import { HistorialEstadoSismo } from './historial-estado-sismo.entity';
import { PosibleDuplicadoSismo } from './posible-duplicado-sismo.entity';
import { SismoFuente } from './sismo-fuente.entity';
import { TipoMagnitud } from './tipo-magnitud.entity';
import { Municipio } from './municipio.entity';
import { Macrodistrito } from '../../subscriptions/entities/macrodistrito.entity';

@Entity('sismos')
export class Sismo {
  @PrimaryGeneratedColumn({ name: 'id_sismo' })
  idSismo: number;

  @Column({ name: 'id_municipio', nullable: true })
  idMunicipio: number | null;

  @Column({ name: 'id_macrodistrito', nullable: true })
  idMacrodistrito: number | null;

  @Column({ name: 'id_tipo_magnitud' })
  idTipoMagnitud: number;

  @Column({ name: 'id_estado_sismo' })
  idEstadoSismo: number;

  @Column({ name: 'id_usuario_registro' })
  idUsuarioRegistro: number;

  @Column({ name: 'fecha_hora_utc', type: 'timestamptz' })
  fechaHoraUtc: Date;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  magnitud: string;

  @Column({ name: 'profundidad_km', type: 'decimal', precision: 7, scale: 2 })
  profundidadKm: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  latitud: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  longitud: string;

  @Column({ name: 'observacion_referencia', length: 255, nullable: true })
  observacionReferencia: string;

  @Column({ name: 'fecha_registro', type: 'timestamp', default: () => 'NOW()' })
  fechaRegistro: Date;

  @Column({
    name: 'fecha_ultima_actualizacion',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  fechaUltimaActualizacion: Date;

  @ManyToOne(() => TipoMagnitud, (tipo) => tipo.sismos)
  @JoinColumn({ name: 'id_tipo_magnitud' })
  tipoMagnitud: TipoMagnitud;

  @ManyToOne(() => EstadoSismo, (estado) => estado.sismos)
  @JoinColumn({ name: 'id_estado_sismo' })
  estado: EstadoSismo;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario_registro' })
  usuarioRegistro: Usuario;

  @ManyToOne(() => Municipio, { nullable: true })
  @JoinColumn({ name: 'id_municipio' })
  municipio: Municipio | null;

  @ManyToOne(() => Macrodistrito, { nullable: true })
  @JoinColumn({ name: 'id_macrodistrito' })
  macrodistrito: Macrodistrito | null;

  @OneToMany(() => SismoFuente, (sismoFuente) => sismoFuente.sismo)
  fuentes: SismoFuente[];

  @OneToMany(() => HistorialEstadoSismo, (historial) => historial.sismo)
  historialEstados: HistorialEstadoSismo[];

  @OneToMany(() => HistorialCambioSismo, (historial) => historial.sismo)
  historialCambios: HistorialCambioSismo[];

  @OneToMany(() => PosibleDuplicadoSismo, (duplicado) => duplicado.sismoCandidato)
  duplicadosComoCandidato: PosibleDuplicadoSismo[];

  @OneToMany(() => PosibleDuplicadoSismo, (duplicado) => duplicado.sismoCoincidente)
  duplicadosComoCoincidente: PosibleDuplicadoSismo[];
}
