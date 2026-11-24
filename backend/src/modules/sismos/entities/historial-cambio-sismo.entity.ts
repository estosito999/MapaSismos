import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';
import { Sismo } from './sismo.entity';

@Entity('historial_cambios_sismo')
export class HistorialCambioSismo {
  @PrimaryGeneratedColumn({ name: 'id_cambio' })
  idCambio: number;

  @Column({ name: 'id_sismo' })
  idSismo: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'campo_modificado', length: 100 })
  campoModificado: string;

  @Column({ name: 'valor_anterior', length: 255, nullable: true })
  valorAnterior: string;

  @Column({ name: 'valor_nuevo', length: 255, nullable: true })
  valorNuevo: string;

  @Column({ name: 'fecha_cambio', type: 'timestamp', default: () => 'NOW()' })
  fechaCambio: Date;

  @ManyToOne(() => Sismo, (sismo) => sismo.historialCambios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_sismo' })
  sismo: Sismo;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;
}
