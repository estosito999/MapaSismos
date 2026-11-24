import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../users/entities/usuario.entity';
import { Rol } from '../users/entities/rol.entity';
import { SesionUsuario } from '../users/entities/sesion-usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RoleName } from '../../common/constants/roles.constant';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12; // RNF03: Coste >= 12

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(SesionUsuario)
    private readonly sesionRepository: Repository<SesionUsuario>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { nombre, apellidos, correo, password, telefono } = registerDto;

    // Verificar unicidad del correo (RF5.01)
    const existing = await this.usuarioRepository.findOne({ where: { correo: correo.toLowerCase() } });
    if (existing) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Rol por defecto: Ciudadano
    let rolCiudadano = await this.rolRepository.findOne({ where: { nombre: RoleName.CIUDADANO } });
    if (!rolCiudadano) {
      rolCiudadano = await this.rolRepository.save({
        nombre: RoleName.CIUDADANO,
        descripcion: 'Usuario registrado estándar',
      });
    }

    // Hashear contraseña con bcrypt factor 12 (RNF03)
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_ROUNDS);

    const usuario = this.usuarioRepository.create({
      nombre,
      apellidos,
      correo: correo.toLowerCase(),
      passwordHash,
      telefono: telefono || null,
      estado: true,
      roles: [rolCiudadano],
    });

    const savedUser = await this.usuarioRepository.save(usuario);

    // Generar token JWT
    const token = this.generateToken(savedUser);

    // Registrar sesión
    await this.recordSession(savedUser.idUsuario, token);

    return {
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        idUsuario: savedUser.idUsuario,
        nombre: savedUser.nombre,
        apellidos: savedUser.apellidos,
        correo: savedUser.correo,
        roles: [RoleName.CIUDADANO],
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { correo, password } = loginDto;

    const usuario = await this.usuarioRepository.findOne({
      where: { correo: correo.toLowerCase() },
      relations: ['roles'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!usuario.estado) {
      throw new UnauthorizedException('Cuenta suspendida. Contacte al administrador');
    }

    const isValid = await bcrypt.compare(password, usuario.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.generateToken(usuario);
    await this.recordSession(usuario.idUsuario, token);

    return {
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        telefono: usuario.telefono,
        roles: usuario.roles.map((r) => r.nombre),
        requiereCambioClave: usuario.requiereCambioClave,
      },
    };
  }

  async logout(idUsuario: number, token?: string) {
    if (token) {
      const cleanToken = token.replace('Bearer ', '');
      await this.sesionRepository.update(
        { idUsuario, token: cleanToken },
        { revocada: true },
      );
    }
    return { mensaje: 'Sesión cerrada correctamente' };
  }

  private generateToken(usuario: Usuario): string {
    const payload = {
      sub: usuario.idUsuario,
      correo: usuario.correo,
      roles: usuario.roles ? usuario.roles.map((r) => r.nombre) : [],
    };
    return this.jwtService.sign(payload);
  }

  private async recordSession(idUsuario: number, token: string) {
    try {
      const expiracion = new Date();
      expiracion.setHours(expiracion.getHours() + 1); // 60 min (RNF03)

      await this.sesionRepository.save({
        idUsuario,
        token,
        fechaExpiracion: expiracion,
        revocada: false,
      });
    } catch {
      // Ignorar si falla registro de sesión para no romper el flujo
    }
  }
}
