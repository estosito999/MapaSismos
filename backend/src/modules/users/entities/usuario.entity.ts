import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Rol } from './rol.entity';
import { PerfilSismologo } from './perfil-sismologo.entity';
import { SesionUsuario } from './sesion-usuario.entity';
import { SuscripcionAlerta } from '../../subscriptions/entities/suscripcion-alerta.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 100, unique: true })
  correo: string;

  @Column({ length: 20, unique: true, nullable: true })
  ci: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ default: true })
  estado: boolean;

  @Column({ name: 'requiere_cambio_clave', default: false })
  requiereCambioClave: boolean;

  @Column({ name: 'fecha_creacion', type: 'date', default: () => 'CURRENT_DATE' })
  fechaCreacion: string;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;

  @ManyToMany(() => Rol, (rol) => rol.usuarios, { eager: true })
  @JoinTable({
    name: 'usuarios_roles',
    joinColumn: { name: 'id_usuario', referencedColumnName: 'idUsuario' },
    inverseJoinColumn: { name: 'id_rol', referencedColumnName: 'idRol' },
  })
  roles: Rol[];

  @OneToOne(() => PerfilSismologo, (perfil) => perfil.usuario)
  perfilSismologo: PerfilSismologo;

  @OneToMany(() => SesionUsuario, (sesion) => sesion.usuario)
  sesiones: SesionUsuario[];

  @OneToMany(() => SuscripcionAlerta, (sub) => sub.usuario)
  suscripciones: SuscripcionAlerta[];
}
