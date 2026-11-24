import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Sismo } from './sismo.entity';

@Entity('tipos_magnitud')
export class TipoMagnitud {
  @PrimaryGeneratedColumn({ name: 'id_tipo_magnitud' })
  idTipoMagnitud: number;

  @Column({ length: 100, unique: true })
  codigo: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255, nullable: true })
  descripcion: string;

  @OneToMany(() => Sismo, (sismo) => sismo.tipoMagnitud)
  sismos: Sismo[];
}
