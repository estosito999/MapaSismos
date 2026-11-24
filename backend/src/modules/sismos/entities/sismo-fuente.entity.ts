import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FuenteSismica } from './fuente-sismica.entity';
import { Sismo } from './sismo.entity';

@Entity('sismos_fuentes')
export class SismoFuente {
  @PrimaryGeneratedColumn({ name: 'id_sismo_fuente' })
  idSismoFuente: number;

  @Column({ name: 'id_sismo' })
  idSismo: number;

  @Column({ name: 'id_fuente' })
  idFuente: number;

  @Column({ name: 'identificador_externo', length: 255, nullable: true })
  identificadorExterno: string;

  @Column({ name: 'fecha_consulta', type: 'timestamp', nullable: true })
  fechaConsulta: Date;

  @Column({ name: 'es_fuente_principal', default: false })
  esFuentePrincipal: boolean;

  @ManyToOne(() => Sismo, (sismo) => sismo.fuentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_sismo' })
  sismo: Sismo;

  @ManyToOne(() => FuenteSismica, (fuente) => fuente.sismosFuentes)
  @JoinColumn({ name: 'id_fuente' })
  fuente: FuenteSismica;
}
