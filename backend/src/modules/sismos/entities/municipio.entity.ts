import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('municipios')
export class Municipio {
  @PrimaryGeneratedColumn({ name: 'id_municipio' })
  idMunicipio: number;
  @Column({ length: 100 }) nombre: string;
  @Column({ length: 100 }) departamento: string;
  @Column({ name: 'codigo_ine', length: 100, nullable: true }) codigoIne: string | null;
}
