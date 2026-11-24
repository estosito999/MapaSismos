import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminModule } from './modules/admin/admin.module';
import { SismosModule, SISMOS_ENTITIES } from './modules/sismos/sismos.module';

import { Usuario } from './modules/users/entities/usuario.entity';
import { Rol } from './modules/users/entities/rol.entity';
import { PerfilSismologo } from './modules/users/entities/perfil-sismologo.entity';
import { SesionUsuario } from './modules/users/entities/sesion-usuario.entity';
import { Macrodistrito } from './modules/subscriptions/entities/macrodistrito.entity';
import { SuscripcionAlerta } from './modules/subscriptions/entities/suscripcion-alerta.entity';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_DATABASE || 'sismopaz_db',
      entities: [
        Usuario,
        Rol,
        PerfilSismologo,
        SesionUsuario,
        Macrodistrito,
        SuscripcionAlerta,
        ...SISMOS_ENTITIES,
      ],
      synchronize: false, // Usamos las migraciones/scripts SQL existentes
      logging: false,
    }),
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    AdminModule,
    SismosModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
