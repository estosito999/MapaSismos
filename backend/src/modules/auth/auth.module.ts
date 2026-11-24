import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Usuario } from '../users/entities/usuario.entity';
import { Rol } from '../users/entities/rol.entity';
import { SesionUsuario } from '../users/entities/sesion-usuario.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'sismopaz_secret_key_super_segura_2026_grupo18_lp',
        signOptions: {
          expiresIn: '60m', // RNF03: Máximo 60 minutos
        },
      }),
    }),
    TypeOrmModule.forFeature([Usuario, Rol, SesionUsuario]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
