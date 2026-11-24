import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SuscripcionAlerta } from './suscripcion-alerta.entity';

@Entity('macrodistritos')
export class Macrodistrito {
  @PrimaryGeneratedColumn({ name: 'id_macrodistrito' })
  idMacrodistrito: number;

  @Column({ name: 'id_municipio' })
  idMunicipio: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @OneToMany(() => SuscripcionAlerta, (sub) => sub.macrodistrito)
  suscripciones: SuscripcionAlerta[];
}
