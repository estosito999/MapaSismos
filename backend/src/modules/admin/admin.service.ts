import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../users/entities/usuario.entity';
import { Rol } from '../users/entities/rol.entity';
import { PerfilSismologo } from '../users/entities/perfil-sismologo.entity';
import { SesionUsuario } from '../users/entities/sesion-usuario.entity';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RoleName } from '../../common/constants/roles.constant';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectRepository(PerfilSismologo)
    private readonly perfilSismologoRepo: Repository<PerfilSismologo>,
    @InjectRepository(SesionUsuario)
    private readonly sesionRepo: Repository<SesionUsuario>,
  ) {}

  async createUser(dto: CreateUserDto) {
    const correo = dto.correo.trim().toLowerCase();
    const ci = dto.ci.trim();

    if (!ci) {
      throw new BadRequestException('La CI es obligatoria');
    }
    if (await this.usuarioRepo.findOne({ where: { correo } })) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }
    if (await this.usuarioRepo.findOne({ where: { ci } })) {
      throw new ConflictException('La CI ya está registrada');
    }

    const rol = await this.rolRepo.findOne({ where: { nombre: dto.rol } });
    if (!rol) {
      throw new NotFoundException('El rol especificado no existe');
    }

    if (
      dto.rol === RoleName.SISMOLOGO &&
      (!dto.numeroAcreditacion?.trim() || !dto.institucionAcreditadora?.trim())
    ) {
      throw new BadRequestException(
        'Para crear un Sismólogo se requieren matrícula e institución acreditadora',
      );
    }

    // La CI es la contraseña inicial; se hashea con el mismo coste que el registro
    const passwordHash = await bcrypt.hash(ci, this.BCRYPT_ROUNDS);

    const usuario = this.usuarioRepo.create({
      nombre: dto.nombre,
      apellidos: dto.apellidos,
      correo,
      ci,
      passwordHash,
      telefono: dto.telefono || null,
      estado: true,
      requiereCambioClave: true,
      roles: [rol],
    });
    const saved = await this.usuarioRepo.save(usuario);

    if (dto.rol === RoleName.SISMOLOGO) {
      await this.perfilSismologoRepo.save(
        this.perfilSismologoRepo.create({
          idUsuario: saved.idUsuario,
          numeroAcreditacion: dto.numeroAcreditacion.trim(),
          institucionAcreditadora: dto.institucionAcreditadora.trim(),
          fechaVerificacion: new Date().toISOString().split('T')[0],
          vigente: true,
          estadoSolicitud: 'APROBADA',
        }),
      );
    }

    return {
      mensaje: `Cuenta ${rol.nombre} creada. Su contraseña inicial es la CI y deberá cambiarla en el primer ingreso.`,
      usuario: {
        idUsuario: saved.idUsuario,
        nombre: saved.nombre,
        apellidos: saved.apellidos,
        correo: saved.correo,
        ci: saved.ci,
        roles: [rol.nombre],
      },
    };
  }

  async listUsers(search?: string, roleFilter?: string) {
    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.roles', 'r')
      .leftJoinAndSelect('u.perfilSismologo', 'ps')
      .orderBy('u.fechaCreacion', 'DESC');

    if (search) {
      qb.andWhere(
        '(LOWER(u.nombre) LIKE :s OR LOWER(u.apellidos) LIKE :s OR LOWER(u.correo) LIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }

    if (roleFilter) {
      qb.andWhere('r.nombre = :roleFilter', { roleFilter });
    }

    const users = await qb.getMany();

    return users.map((u) => ({
      idUsuario: u.idUsuario,
      nombre: u.nombre,
      apellidos: u.apellidos,
      correo: u.correo,
      telefono: u.telefono,
      estado: u.estado,
      ci: u.ci,
      fechaCreacion: u.fechaCreacion,
      roles: u.roles.map((r) => r.nombre),
      perfilSismologo: u.perfilSismologo
        ? {
            numeroAcreditacion: u.perfilSismologo.numeroAcreditacion,
            institucionAcreditadora: u.perfilSismologo.institucionAcreditadora,
            vigente: u.perfilSismologo.vigente,
            estadoSolicitud: u.perfilSismologo.estadoSolicitud,
            fechaVerificacion: u.perfilSismologo.fechaVerificacion,
          }
        : null,
    }));
  }

  async getUserById(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['roles', 'perfilSismologo', 'suscripciones', 'suscripciones.macrodistrito'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async updateUserStatus(idUsuario: number, dto: UpdateUserStatusDto) {
    const usuario = await this.usuarioRepo.findOne({ where: { idUsuario } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    usuario.estado = dto.estado;
    usuario.fechaActualizacion = new Date();
    await this.usuarioRepo.save(usuario);

    // Si se suspende la cuenta, revocar todas sus sesiones activas (RF5.03 / HU17)
    if (!dto.estado) {
      await this.sesionRepo.update({ idUsuario }, { revocada: true });
    }

    return {
      mensaje: dto.estado ? 'Cuenta de usuario activada' : 'Cuenta de usuario suspendida y sesiones revocadas',
      estado: usuario.estado,
    };
  }

  async assignRole(idUsuario: number, dto: AssignRoleDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['roles', 'perfilSismologo'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const rol = await this.rolRepo.findOne({ where: { idRol: dto.idRol } });
    if (!rol) {
      throw new NotFoundException('El rol especificado no existe');
    }

    // Regla RF5.03: Si se asigna el rol Sismólogo, es obligatorio contar con acreditación profesional
    if (rol.nombre === RoleName.SISMOLOGO) {
      // Tomar la matrícula enviada en el DTO o la que el usuario ya tenga aprobada/registrada previamente
      const matricula =
        (dto.numeroAcreditacion && dto.numeroAcreditacion.trim()) ||
        usuario.perfilSismologo?.numeroAcreditacion;

      if (!matricula) {
        throw new BadRequestException(
          'Para asignar el rol Sismólogo es obligatorio contar con número de acreditación o matrícula profesional',
        );
      }

      const institucion =
        (dto.institucionAcreditadora && dto.institucionAcreditadora.trim()) ||
        usuario.perfilSismologo?.institucionAcreditadora ||
        'Observatorio San Calixto';

      let perfil = await this.perfilSismologoRepo.findOne({ where: { idUsuario } });
      if (!perfil) {
        perfil = this.perfilSismologoRepo.create({
          idUsuario,
          numeroAcreditacion: matricula,
          institucionAcreditadora: institucion,
          fechaVerificacion: new Date().toISOString().split('T')[0],
          vigente: true,
          estadoSolicitud: 'APROBADA',
        });
      } else {
        perfil.numeroAcreditacion = matricula;
        perfil.institucionAcreditadora = institucion;
        perfil.vigente = true;
        perfil.estadoSolicitud = 'APROBADA';
        perfil.fechaVerificacion = new Date().toISOString().split('T')[0];
      }
      await this.perfilSismologoRepo.save(perfil);
      usuario.perfilSismologo = perfil;
    }

    // Regla de unicidad de rol: Reemplazar roles para que el usuario tenga exactamente 1 solo rol
    usuario.roles = [rol];
    await this.usuarioRepo.save(usuario);

    return {
      mensaje: `Rol ${rol.nombre} asignado exitosamente al usuario (rol único)`,
      roles: usuario.roles.map((r) => r.nombre),
    };
  }

  async getSolicitudesSismologo() {
    const qb = this.usuarioRepo
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.perfilSismologo', 'ps', 'ps.estadoSolicitud = :estado', {
        estado: 'PENDIENTE',
      })
      .leftJoinAndSelect('u.roles', 'r')
      .orderBy('u.fechaActualizacion', 'DESC');

    const users = await qb.getMany();

    return users.map((u) => ({
      idUsuario: u.idUsuario,
      nombre: u.nombre,
      apellidos: u.apellidos,
      correo: u.correo,
      telefono: u.telefono,
      roles: u.roles.map((r) => r.nombre),
      numeroAcreditacion: u.perfilSismologo.numeroAcreditacion,
      institucionAcreditadora: u.perfilSismologo.institucionAcreditadora,
      estadoSolicitud: u.perfilSismologo.estadoSolicitud,
    }));
  }

  async aprobarSolicitud(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['roles', 'perfilSismologo'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.perfilSismologo || usuario.perfilSismologo.estadoSolicitud !== 'PENDIENTE') {
      throw new BadRequestException('El usuario no tiene una solicitud pendiente de revisión');
    }

    const rolSismologo = await this.rolRepo.findOne({
      where: { nombre: RoleName.SISMOLOGO },
    });
    if (!rolSismologo) {
      throw new NotFoundException('El rol Sismólogo no se encuentra configurado en la base de datos');
    }

    // Actualizar perfil sismólogo
    usuario.perfilSismologo.vigente = true;
    usuario.perfilSismologo.fechaVerificacion = new Date().toISOString().split('T')[0];
    usuario.perfilSismologo.estadoSolicitud = 'APROBADA';
    await this.perfilSismologoRepo.save(usuario.perfilSismologo);

    // Reemplazo estricto: el usuario pasa a ser exclusivamente Sismólogo
    usuario.roles = [rolSismologo];
    usuario.fechaActualizacion = new Date();
    await this.usuarioRepo.save(usuario);

    return {
      mensaje: `Solicitud aprobada con éxito. El usuario ${usuario.nombre} ${usuario.apellidos} ahora cuenta con rol Sismólogo.`,
      roles: usuario.roles.map((r) => r.nombre),
      perfilSismologo: {
        numeroAcreditacion: usuario.perfilSismologo.numeroAcreditacion,
        institucionAcreditadora: usuario.perfilSismologo.institucionAcreditadora,
        estadoSolicitud: usuario.perfilSismologo.estadoSolicitud,
        vigente: usuario.perfilSismologo.vigente,
      },
    };
  }

  async rechazarSolicitud(idUsuario: number) {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['perfilSismologo'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!usuario.perfilSismologo || usuario.perfilSismologo.estadoSolicitud !== 'PENDIENTE') {
      throw new BadRequestException('El usuario no tiene una solicitud pendiente de revisión');
    }

    usuario.perfilSismologo.estadoSolicitud = 'RECHAZADA';
    usuario.perfilSismologo.vigente = false;
    await this.perfilSismologoRepo.save(usuario.perfilSismologo);

    return {
      mensaje: `La solicitud de acreditación del usuario ${usuario.nombre} ha sido rechazada. Mantiene su rol actual.`,
      estadoSolicitud: 'RECHAZADA',
    };
  }

  async getAllRoles() {
    return this.rolRepo.find();
  }
}
