import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Usuario } from './entities/usuario.entity';
import { Rol } from './entities/rol.entity';
import { PerfilSismologo } from './entities/perfil-sismologo.entity';
import { SesionUsuario } from './entities/sesion-usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Rol, PerfilSismologo, SesionUsuario])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
