import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Usuario } from '../users/entities/usuario.entity';
import { Rol } from '../users/entities/rol.entity';
import { PerfilSismologo } from '../users/entities/perfil-sismologo.entity';
import { SesionUsuario } from '../users/entities/sesion-usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol, PerfilSismologo, SesionUsuario])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
