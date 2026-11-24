import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SismoFuente } from './sismo-fuente.entity';

@Entity('fuentes_sismicas')
export class FuenteSismica {
  @PrimaryGeneratedColumn({ name: 'id_fuente' })
  idFuente: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50, nullable: true })
  tipo: string;

  @Column({ length: 100, nullable: true })
  institucion: string;

  @Column({ length: 255, nullable: true })
  url: string;

  @Column({ name: 'es_oficial', default: false })
  esOficial: boolean;

  @Column({ default: true })
  activa: boolean;

  @OneToMany(() => SismoFuente, (sismoFuente) => sismoFuente.fuente)
  sismosFuentes: SismoFuente[];
}
