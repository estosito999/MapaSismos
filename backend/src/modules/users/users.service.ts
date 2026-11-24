import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { PerfilSismologo } from './entities/perfil-sismologo.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SolicitarSismologoDto } from './dto/solicitar-sismologo.dto';
import { RoleName } from '../../common/constants/roles.constant';

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(PerfilSismologo)
    private readonly perfilSismologoRepo: Repository<PerfilSismologo>,
  ) {}

  async getProfile(idUsuario: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario },
      relations: ['roles', 'perfilSismologo', 'suscripciones', 'suscripciones.macrodistrito'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      telefono: usuario.telefono,
      estado: usuario.estado,
      ci: usuario.ci,
      requiereCambioClave: usuario.requiereCambioClave,
      fechaCreacion: usuario.fechaCreacion,
      fechaActualizacion: usuario.fechaActualizacion,
      roles: usuario.roles.map((r) => r.nombre),
      perfilSismologo: usuario.perfilSismologo
        ? {
            numeroAcreditacion: usuario.perfilSismologo.numeroAcreditacion,
            institucionAcreditadora: usuario.perfilSismologo.institucionAcreditadora,
            vigente: usuario.perfilSismologo.vigente,
            estadoSolicitud: usuario.perfilSismologo.estadoSolicitud,
            fechaVerificacion: usuario.perfilSismologo.fechaVerificacion,
          }
        : null,
      suscripciones: usuario.suscripciones.map((s) => ({
        idSuscripcion: s.idSuscripcion,
        idMacrodistrito: s.idMacrodistrito,
        macrodistrito: s.macrodistrito ? s.macrodistrito.nombre : null,
        activa: s.activa,
        fechaSuscripcion: s.fechaSuscripcion,
      })),
    };
  }

  async solicitarSismologo(idUsuario: number, dto: SolicitarSismologoDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario },
      relations: ['roles', 'perfilSismologo'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const yaEsSismologo = usuario.roles.some((r) => r.nombre === RoleName.SISMOLOGO);
    if (yaEsSismologo) {
      throw new BadRequestException('El usuario ya cuenta con el rol de Sismólogo');
    }

    if (usuario.perfilSismologo && usuario.perfilSismologo.estadoSolicitud === 'PENDIENTE') {
      throw new BadRequestException('Ya cuentas con una solicitud de acreditación en proceso de revisión');
    }

    let perfil = usuario.perfilSismologo;
    if (!perfil) {
      perfil = this.perfilSismologoRepo.create({
        idUsuario,
        numeroAcreditacion: dto.numeroAcreditacion.trim(),
        institucionAcreditadora: dto.institucionAcreditadora.trim(),
        vigente: false,
        fechaVerificacion: null,
        estadoSolicitud: 'PENDIENTE',
      });
    } else {
      perfil.numeroAcreditacion = dto.numeroAcreditacion.trim();
      perfil.institucionAcreditadora = dto.institucionAcreditadora.trim();
      perfil.vigente = false;
      perfil.fechaVerificacion = null;
      perfil.estadoSolicitud = 'PENDIENTE';
    }

    await this.perfilSismologoRepo.save(perfil);

    return {
      mensaje: 'Solicitud de acreditación enviada correctamente. El Administrador verificará su matrícula técnica.',
      perfilSismologo: {
        numeroAcreditacion: perfil.numeroAcreditacion,
        institucionAcreditadora: perfil.institucionAcreditadora,
        estadoSolicitud: perfil.estadoSolicitud,
        vigente: perfil.vigente,
      },
    };
  }

  async updateProfile(idUsuario: number, updateDto: UpdateProfileDto) {
    const usuario = await this.usuarioRepository.findOne({ where: { idUsuario } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (updateDto.correo !== undefined) {
      const correo = updateDto.correo.trim().toLowerCase();
      const existente = await this.usuarioRepository.findOne({ where: { correo } });
      if (existente && existente.idUsuario !== idUsuario) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      usuario.correo = correo;
    }

    if (updateDto.ci !== undefined) {
      const ci = updateDto.ci.trim() || null;
      if (ci) {
        const existente = await this.usuarioRepository.findOne({ where: { ci } });
        if (existente && existente.idUsuario !== idUsuario) {
          throw new ConflictException('La CI ya está registrada');
        }
      }
      usuario.ci = ci;
    }

    if (updateDto.nombre !== undefined) usuario.nombre = updateDto.nombre;
    if (updateDto.apellidos !== undefined) usuario.apellidos = updateDto.apellidos;
    if (updateDto.telefono !== undefined) usuario.telefono = updateDto.telefono;
    usuario.fechaActualizacion = new Date();

    const saved = await this.usuarioRepository.save(usuario);

    return {
      mensaje: 'Perfil actualizado exitosamente',
      usuario: {
        idUsuario: saved.idUsuario,
        nombre: saved.nombre,
        apellidos: saved.apellidos,
        correo: saved.correo,
        ci: saved.ci,
        telefono: saved.telefono,
      },
    };
  }

  async changePassword(idUsuario: number, changePasswordDto: ChangePasswordDto) {
    if (changePasswordDto.passwordNuevo !== changePasswordDto.repetirPassword) {
      throw new BadRequestException('La nueva contraseña y la confirmación no coinciden');
    }

    const usuario = await this.usuarioRepository.findOne({ where: { idUsuario } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(changePasswordDto.passwordActual, usuario.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    usuario.passwordHash = await bcrypt.hash(changePasswordDto.passwordNuevo, this.BCRYPT_ROUNDS);
    usuario.requiereCambioClave = false;
    usuario.fechaActualizacion = new Date();
    await this.usuarioRepository.save(usuario);

    return { mensaje: 'Contraseña actualizada correctamente' };
  }
}
