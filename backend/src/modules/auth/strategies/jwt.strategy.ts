import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../users/entities/usuario.entity';

export interface JwtPayload {
  sub: number;
  correo: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sismopaz_secret_key_super_segura_2026_grupo18_lp',
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario: payload.sub },
      relations: ['roles'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!usuario.estado) {
      throw new UnauthorizedException('Cuenta suspendida. Contacte al administrador.');
    }

    return {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      roles: usuario.roles.map((r) => r.nombre),
      requiereCambioClave: usuario.requiereCambioClave,
    };
  }
}
