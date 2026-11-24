import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateSismoDto } from './dto/create-sismo.dto';
import { FilterSismosDto } from './dto/filter-sismos.dto';
import { UpdateSismoDto } from './dto/update-sismo.dto';
import { ChangeSismoStateDto } from './dto/change-sismo-state.dto';
import { FilterDuplicatesDto } from './dto/filter-duplicates.dto';
import { ResolveDuplicateDto } from './dto/resolve-duplicate.dto';
import { EstadoSismo } from './entities/estado-sismo.entity';
import { FuenteSismica } from './entities/fuente-sismica.entity';
import { HistorialEstadoSismo } from './entities/historial-estado-sismo.entity';
import { HistorialCambioSismo } from './entities/historial-cambio-sismo.entity';
import { PosibleDuplicadoSismo } from './entities/posible-duplicado-sismo.entity';
import { SismoFuente } from './entities/sismo-fuente.entity';
import { Sismo } from './entities/sismo.entity';
import { TipoMagnitud } from './entities/tipo-magnitud.entity';

@Injectable()
export class SismosService {
  private readonly duplicateThresholds = {
    tiempoSegundos: Number(process.env.DUPLICATE_TIME_SECONDS || 300),
    distanciaKm: Number(process.env.DUPLICATE_DISTANCE_KM || 50),
    magnitud: Number(process.env.DUPLICATE_MAGNITUDE_DELTA || 0.5),
    profundidadKm: Number(process.env.DUPLICATE_DEPTH_DELTA_KM || 20),
  };

  constructor(
    @InjectRepository(TipoMagnitud)
    private readonly tipoMagnitudRepo: Repository<TipoMagnitud>,
    @InjectRepository(EstadoSismo)
    private readonly estadoSismoRepo: Repository<EstadoSismo>,
    @InjectRepository(FuenteSismica)
    private readonly fuenteSismicaRepo: Repository<FuenteSismica>,
    private readonly dataSource: DataSource,
  ) {}

  async getTiposMagnitud() {
    return this.tipoMagnitudRepo.find({ order: { codigo: 'ASC' } });
  }

  async getEstados() {
    return this.estadoSismoRepo.find({ order: { idEstadoSismo: 'ASC' } });
  }

  async getFuentes() {
    return this.fuenteSismicaRepo.find({
      where: { activa: true },
      order: { esOficial: 'DESC', nombre: 'ASC' },
    });
  }

  async getMunicipios() {
    return this.dataSource.query(
      'SELECT id_municipio AS "idMunicipio", nombre, departamento, codigo_ine AS "codigoIne" FROM municipios ORDER BY nombre',
    );
  }

  async getMacrodistritos(idMunicipio?: number) {
    return this.dataSource.query(
      `SELECT id_macrodistrito AS "idMacrodistrito", id_municipio AS "idMunicipio", nombre
       FROM macrodistritos WHERE ($1::int IS NULL OR id_municipio=$1) ORDER BY nombre`,
      [idMunicipio || null],
    );
  }

  private async validarTerritorio(idMunicipio?: number | null, idMacrodistrito?: number | null) {
    if (idMacrodistrito && !idMunicipio) {
      throw new BadRequestException('Debe seleccionar el municipio al indicar un macrodistrito');
    }
    if (!idMunicipio) return;
    const filas = await this.dataSource.query(
      `SELECT m.id_municipio, md.id_macrodistrito
       FROM municipios m LEFT JOIN macrodistritos md
         ON md.id_municipio=m.id_municipio AND md.id_macrodistrito=$2
       WHERE m.id_municipio=$1`,
      [idMunicipio, idMacrodistrito || null],
    );
    if (!filas.length) throw new NotFoundException('El municipio seleccionado no existe');
    if (idMacrodistrito && !filas[0].id_macrodistrito) {
      throw new BadRequestException('El macrodistrito no pertenece al municipio seleccionado');
    }
  }

  async findAll(filtros: FilterSismosDto) {
    if (
      filtros.fechaDesde &&
      filtros.fechaHasta &&
      new Date(filtros.fechaDesde) > new Date(filtros.fechaHasta)
    ) {
      throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final');
    }

    if (
      filtros.magnitudMin !== undefined &&
      filtros.magnitudMax !== undefined &&
      filtros.magnitudMin > filtros.magnitudMax
    ) {
      throw new BadRequestException('La magnitud mínima no puede superar la magnitud máxima');
    }

    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 10;
    const query = this.dataSource
      .getRepository(Sismo)
      .createQueryBuilder('sismo')
      .leftJoinAndSelect('sismo.tipoMagnitud', 'tipoMagnitud')
      .leftJoinAndSelect('sismo.estado', 'estado')
      .leftJoinAndSelect('sismo.fuentes', 'sismoFuente')
      .leftJoinAndSelect('sismoFuente.fuente', 'fuente')
      .distinct(true);

    if (filtros.fechaDesde) {
      query.andWhere('sismo.fecha_hora_utc >= :fechaDesde', {
        fechaDesde: new Date(filtros.fechaDesde),
      });
    }
    if (filtros.fechaHasta) {
      query.andWhere('sismo.fecha_hora_utc <= :fechaHasta', {
        fechaHasta: new Date(filtros.fechaHasta),
      });
    }
    if (filtros.magnitudMin !== undefined) {
      query.andWhere('sismo.magnitud >= :magnitudMin', {
        magnitudMin: filtros.magnitudMin,
      });
    }
    if (filtros.magnitudMax !== undefined) {
      query.andWhere('sismo.magnitud <= :magnitudMax', {
        magnitudMax: filtros.magnitudMax,
      });
    }
    if (filtros.idTipoMagnitud) {
      query.andWhere('sismo.id_tipo_magnitud = :idTipoMagnitud', {
        idTipoMagnitud: filtros.idTipoMagnitud,
      });
    }
    if (filtros.idEstadoSismo) {
      query.andWhere('sismo.id_estado_sismo = :idEstadoSismo', {
        idEstadoSismo: filtros.idEstadoSismo,
      });
    }
    if (filtros.idFuente) {
      query.andWhere('sismoFuente.id_fuente = :idFuente', {
        idFuente: filtros.idFuente,
      });
    }
    if (filtros.ubicacion?.trim()) {
      query.andWhere('sismo.observacion_referencia ILIKE :ubicacion', {
        ubicacion: `%${filtros.ubicacion.trim()}%`,
      });
    }

    query
      .orderBy('sismo.fechaHoraUtc', 'DESC')
      .addOrderBy('sismo.idSismo', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [eventos, total] = await query.getManyAndCount();
    const totalPaginas = Math.max(1, Math.ceil(total / limite));

    return {
      items: eventos.map((evento) => this.toListItem(evento)),
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas,
      },
    };
  }

  async findOne(idSismo: number) {
    const evento = await this.dataSource.getRepository(Sismo).findOne({
      where: { idSismo },
      relations: [
        'tipoMagnitud',
        'estado',
        'usuarioRegistro',
        'municipio',
        'macrodistrito',
        'fuentes',
        'fuentes.fuente',
        'historialEstados',
        'historialEstados.estado',
        'historialEstados.usuario',
        'historialCambios',
        'historialCambios.usuario',
        'duplicadosComoCandidato',
        'duplicadosComoCandidato.sismoCoincidente',
        'duplicadosComoCoincidente',
        'duplicadosComoCoincidente.sismoCandidato',
      ],
    });

    if (!evento) {
      throw new NotFoundException('Evento sísmico no encontrado');
    }

    return {
      ...this.toListItem(evento),
      latitud: Number(evento.latitud),
      longitud: Number(evento.longitud),
      fechaRegistro: evento.fechaRegistro,
      fechaUltimaActualizacion: evento.fechaUltimaActualizacion,
      registradoPor: {
        idUsuario: evento.usuarioRegistro.idUsuario,
        nombre: `${evento.usuarioRegistro.nombre} ${evento.usuarioRegistro.apellidos}`,
        correo: evento.usuarioRegistro.correo,
      },
      fuentes: evento.fuentes.map((relacion) => ({
        idSismoFuente: relacion.idSismoFuente,
        idFuente: relacion.idFuente,
        nombre: relacion.fuente.nombre,
        institucion: relacion.fuente.institucion,
        url: relacion.fuente.url,
        esOficial: relacion.fuente.esOficial,
        esFuentePrincipal: relacion.esFuentePrincipal,
        identificadorExterno: relacion.identificadorExterno,
        fechaConsulta: relacion.fechaConsulta,
      })),
      historialEstados: [...evento.historialEstados]
        .sort((a, b) => b.fechaEstado.getTime() - a.fechaEstado.getTime())
        .map((historial) => ({
          idHistorialEstado: historial.idHistorialEstado,
          estado: historial.estado.nombre,
          fechaEstado: historial.fechaEstado,
          observacion: historial.observacion,
          usuario: `${historial.usuario.nombre} ${historial.usuario.apellidos}`,
        })),
      historialCambios: [...evento.historialCambios]
        .sort((a, b) => b.fechaCambio.getTime() - a.fechaCambio.getTime())
        .map((cambio) => ({
          idCambio: cambio.idCambio,
          campoModificado: cambio.campoModificado,
          valorAnterior: cambio.valorAnterior,
          valorNuevo: cambio.valorNuevo,
          fechaCambio: cambio.fechaCambio,
          usuario: `${cambio.usuario.nombre} ${cambio.usuario.apellidos}`,
        })),
      posiblesDuplicados: [
        ...evento.duplicadosComoCandidato.map((duplicado) => ({
          idDuplicidad: duplicado.idDuplicidad,
          idEventoRelacionado: duplicado.idSismoCoincidente,
          estadoRevision: duplicado.estadoRevision,
          fechaDeteccion: duplicado.fechaDeteccion,
          observacion: duplicado.observacion,
        })),
        ...evento.duplicadosComoCoincidente.map((duplicado) => ({
          idDuplicidad: duplicado.idDuplicidad,
          idEventoRelacionado: duplicado.idSismoCandidato,
          estadoRevision: duplicado.estadoRevision,
          fechaDeteccion: duplicado.fechaDeteccion,
          observacion: duplicado.observacion,
        })),
      ],
    };
  }

  async getChangeHistory(idSismo: number) {
    const existe = await this.dataSource.getRepository(Sismo).exist({ where: { idSismo } });
    if (!existe) throw new NotFoundException('Evento sísmico no encontrado');

    const cambios = await this.dataSource.getRepository(HistorialCambioSismo).find({
      where: { idSismo },
      relations: ['usuario'],
      order: { fechaCambio: 'DESC', idCambio: 'DESC' },
    });

    return cambios.map((cambio) => ({
      idCambio: cambio.idCambio,
      campoModificado: cambio.campoModificado,
      valorAnterior: cambio.valorAnterior,
      valorNuevo: cambio.valorNuevo,
      fechaCambio: cambio.fechaCambio,
      usuario: `${cambio.usuario.nombre} ${cambio.usuario.apellidos}`,
    }));
  }

  async findDuplicateCases(filtros: FilterDuplicatesDto) {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 10;
    const repo = this.dataSource.getRepository(PosibleDuplicadoSismo);
    const query = repo
      .createQueryBuilder('duplicado')
      .leftJoinAndSelect('duplicado.sismoCandidato', 'candidato')
      .leftJoinAndSelect('candidato.tipoMagnitud', 'tipoCandidato')
      .leftJoinAndSelect('candidato.estado', 'estadoCandidato')
      .leftJoinAndSelect('candidato.fuentes', 'fuentesCandidato')
      .leftJoinAndSelect('fuentesCandidato.fuente', 'fuenteCandidato')
      .leftJoinAndSelect('duplicado.sismoCoincidente', 'coincidente')
      .leftJoinAndSelect('coincidente.tipoMagnitud', 'tipoCoincidente')
      .leftJoinAndSelect('coincidente.estado', 'estadoCoincidente')
      .leftJoinAndSelect('coincidente.fuentes', 'fuentesCoincidente')
      .leftJoinAndSelect('fuentesCoincidente.fuente', 'fuenteCoincidente')
      .leftJoinAndSelect('duplicado.usuarioRevision', 'usuarioRevision');

    if (filtros.estadoRevision) {
      query.where('duplicado.estado_revision = :estadoRevision', {
        estadoRevision: filtros.estadoRevision,
      });
    }

    query
      .orderBy('duplicado.fechaDeteccion', 'DESC')
      .addOrderBy('duplicado.idDuplicidad', 'DESC')
      .skip((pagina - 1) * limite)
      .take(limite);

    const [casos, total] = await query.getManyAndCount();
    const totalPaginas = Math.max(1, Math.ceil(total / limite));
    return {
      items: casos.map((caso) => this.toDuplicateCase(caso)),
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas,
      },
    };
  }

  async findDuplicateCase(idDuplicidad: number) {
    const repo = this.dataSource.getRepository(PosibleDuplicadoSismo);
    const caso = await repo.findOne({
      where: { idDuplicidad },
      relations: [
        'sismoCandidato',
        'sismoCandidato.tipoMagnitud',
        'sismoCandidato.estado',
        'sismoCandidato.fuentes',
        'sismoCandidato.fuentes.fuente',
        'sismoCoincidente',
        'sismoCoincidente.tipoMagnitud',
        'sismoCoincidente.estado',
        'sismoCoincidente.fuentes',
        'sismoCoincidente.fuentes.fuente',
        'usuarioRevision',
      ],
    });
    if (!caso) throw new NotFoundException('La coincidencia no existe');
    return this.toDuplicateCase(caso);
  }

  async resolveDuplicateCase(
    idDuplicidad: number,
    dto: ResolveDuplicateDto,
    idUsuario: number,
  ) {
    const repo = this.dataSource.getRepository(PosibleDuplicadoSismo);
    const caso = await repo.findOne({ where: { idDuplicidad } });
    if (!caso) throw new NotFoundException('La coincidencia no existe');
    if (caso.estadoRevision !== 'Pendiente de revisión') {
      throw new ConflictException(
        `La coincidencia ya fue resuelta como: ${caso.estadoRevision}`,
      );
    }

    const observacionPrevia = caso.observacion?.trim();
    const observacionResolucion = dto.observacion.trim();
    caso.estadoRevision = dto.estadoRevision;
    caso.idUsuarioRevision = idUsuario;
    caso.fechaResolucion = new Date();
    caso.observacion = [
      observacionPrevia ? `Detección: ${observacionPrevia}` : null,
      `Resolución: ${observacionResolucion}`,
    ]
      .filter(Boolean)
      .join(' | ')
      .slice(0, 500);
    await repo.save(caso);

    return {
      mensaje: 'Coincidencia resuelta correctamente',
      caso: await this.findDuplicateCase(idDuplicidad),
    };
  }

  async update(idSismo: number, dto: UpdateSismoDto, idUsuario: number) {
    const sismoRepo = this.dataSource.getRepository(Sismo);
    const evento = await sismoRepo.findOne({
      where: { idSismo },
      relations: ['tipoMagnitud', 'estado', 'fuentes', 'fuentes.fuente', 'municipio', 'macrodistrito'],
    });
    if (!evento) throw new NotFoundException('Evento sísmico no encontrado');

    const idMunicipio = dto.idMunicipio !== undefined ? dto.idMunicipio : evento.idMunicipio;
    const idMacrodistrito = dto.idMacrodistrito !== undefined ? dto.idMacrodistrito : evento.idMacrodistrito;
    await this.validarTerritorio(idMunicipio, idMacrodistrito);

    if (
      evento.fechaUltimaActualizacion.getTime() !==
      new Date(dto.fechaUltimaActualizacion).getTime()
    ) {
      throw new ConflictException(
        'El evento fue modificado por otro usuario. Recargue la ficha antes de continuar.',
      );
    }

    const fuentePrincipal = evento.fuentes.find((relacion) => relacion.esFuentePrincipal);
    if (!fuentePrincipal) {
      throw new UnprocessableEntityException('El evento no tiene una fuente principal configurada');
    }

    const idTipoMagnitud = dto.idTipoMagnitud ?? evento.idTipoMagnitud;
    const idFuente = dto.idFuente ?? fuentePrincipal.idFuente;
    const [tipoMagnitud, fuente] = await Promise.all([
      this.tipoMagnitudRepo.findOne({ where: { idTipoMagnitud } }),
      this.fuenteSismicaRepo.findOne({ where: { idFuente, activa: true } }),
    ]);
    if (!tipoMagnitud) throw new NotFoundException('El tipo de magnitud seleccionado no existe');
    if (!fuente) throw new NotFoundException('La fuente sísmica no existe o está inactiva');

    const valoresPropuestos = {
      fechaHoraUtc: dto.fechaHoraUtc ? new Date(dto.fechaHoraUtc) : evento.fechaHoraUtc,
      magnitud: dto.magnitud ?? Number(evento.magnitud),
      profundidadKm: dto.profundidadKm ?? Number(evento.profundidadKm),
      latitud: dto.latitud ?? Number(evento.latitud),
      longitud: dto.longitud ?? Number(evento.longitud),
      observacionReferencia:
        dto.observacionReferencia?.trim() ?? evento.observacionReferencia,
      identificadorExterno:
        dto.identificadorExterno?.trim() ?? fuentePrincipal.identificadorExterno,
    };

    const resultadoDuplicidad = await this.checkDuplicates(
      {
        fechaHoraUtc: valoresPropuestos.fechaHoraUtc.toISOString(),
        magnitud: valoresPropuestos.magnitud,
        idTipoMagnitud,
        profundidadKm: valoresPropuestos.profundidadKm,
        latitud: valoresPropuestos.latitud,
        longitud: valoresPropuestos.longitud,
        observacionReferencia: valoresPropuestos.observacionReferencia,
        idFuente,
        identificadorExterno: valoresPropuestos.identificadorExterno,
      },
      idSismo,
    );
    if (resultadoDuplicidad.posibleDuplicado && dto.confirmarPosibleDuplicado !== true) {
      throw new ConflictException({
        message: 'La actualización genera posibles coincidencias. Se requiere confirmación explícita.',
        codigo: 'POSIBLE_DUPLICADO',
        ...resultadoDuplicidad,
      });
    }

    const cambios: Array<{ campo: string; anterior: string; nuevo: string }> = [];
    const agregarCambio = (campo: string, anterior: unknown, nuevo: unknown) => {
      if (String(anterior ?? '') !== String(nuevo ?? '')) {
        cambios.push({ campo, anterior: String(anterior ?? ''), nuevo: String(nuevo ?? '') });
      }
    };

    agregarCambio('fecha_hora_utc', evento.fechaHoraUtc.toISOString(), valoresPropuestos.fechaHoraUtc.toISOString());
    agregarCambio('magnitud', Number(evento.magnitud), valoresPropuestos.magnitud);
    agregarCambio('tipo_magnitud', evento.tipoMagnitud.codigo, tipoMagnitud.codigo);
    agregarCambio('profundidad_km', Number(evento.profundidadKm), valoresPropuestos.profundidadKm);
    agregarCambio('latitud', Number(evento.latitud), valoresPropuestos.latitud);
    agregarCambio('longitud', Number(evento.longitud), valoresPropuestos.longitud);
    agregarCambio('ubicacion_referencia', evento.observacionReferencia, valoresPropuestos.observacionReferencia);
    agregarCambio('fuente_principal', fuentePrincipal.fuente.nombre, fuente.nombre);
    agregarCambio('identificador_externo', fuentePrincipal.identificadorExterno, valoresPropuestos.identificadorExterno);
    agregarCambio('id_municipio', evento.idMunicipio, idMunicipio);
    agregarCambio('id_macrodistrito', evento.idMacrodistrito, idMacrodistrito);

    if (cambios.length === 0) {
      throw new BadRequestException('No se detectaron cambios en los parámetros del evento');
    }

    await this.dataSource.transaction(async (manager) => {
      const estabaPublicado = evento.estado.nombre === 'Publicado';
      let estadoRevisado: EstadoSismo | null = null;
      if (estabaPublicado) {
        estadoRevisado = await manager.findOne(EstadoSismo, { where: { nombre: 'Revisado' } });
        if (!estadoRevisado) {
          throw new UnprocessableEntityException('No está configurado el estado Revisado');
        }
      }

      evento.fechaHoraUtc = valoresPropuestos.fechaHoraUtc;
      evento.magnitud = valoresPropuestos.magnitud.toFixed(2);
      evento.idTipoMagnitud = idTipoMagnitud;
      evento.tipoMagnitud = tipoMagnitud;
      evento.profundidadKm = valoresPropuestos.profundidadKm.toFixed(2);
      evento.latitud = valoresPropuestos.latitud.toFixed(6);
      evento.longitud = valoresPropuestos.longitud.toFixed(6);
      evento.observacionReferencia = valoresPropuestos.observacionReferencia;
      evento.idMunicipio = idMunicipio || null;
      evento.idMacrodistrito = idMacrodistrito || null;
      if (estadoRevisado) {
        evento.idEstadoSismo = estadoRevisado.idEstadoSismo;
        evento.estado = estadoRevisado;
      }
      evento.fechaUltimaActualizacion = new Date();
      await manager.save(evento);

      fuentePrincipal.idFuente = idFuente;
      fuentePrincipal.fuente = fuente;
      fuentePrincipal.identificadorExterno = valoresPropuestos.identificadorExterno || null;
      fuentePrincipal.fechaConsulta = new Date();
      await manager.save(fuentePrincipal);

      await manager.save(
        cambios.map((cambio) =>
          manager.create(HistorialCambioSismo, {
            idSismo,
            idUsuario,
            campoModificado: cambio.campo,
            valorAnterior: cambio.anterior,
            valorNuevo: cambio.nuevo,
          }),
        ),
      );

      if (estadoRevisado) {
        await manager.save(
          manager.create(HistorialEstadoSismo, {
            idSismo,
            idEstadoSismo: estadoRevisado.idEstadoSismo,
            idUsuario,
            observacion:
              'Evento publicado modificado; retorna automáticamente a Revisado antes de republicar',
          }),
        );
      }

      if (resultadoDuplicidad.posibleDuplicado) {
        const duplicadoRepo = manager.getRepository(PosibleDuplicadoSismo);
        for (const candidato of resultadoDuplicidad.candidatos) {
          const existente = await duplicadoRepo.findOne({
            where: {
              idSismoCandidato: idSismo,
              idSismoCoincidente: candidato.idSismo,
            },
          });
          if (!existente) {
            await duplicadoRepo.save(
              duplicadoRepo.create({
                idSismoCandidato: idSismo,
                idSismoCoincidente: candidato.idSismo,
                estadoRevision: 'Pendiente de revisión',
                observacion: `Coincidencia detectada tras actualización. Motivos: ${candidato.motivos.join(', ')}`,
              }),
            );
          }
        }
      }
    });

    return {
      mensaje: 'Evento sísmico actualizado correctamente',
      cambiosRegistrados: cambios.length,
      evento: await this.findOne(idSismo),
    };
  }

  async changeState(idSismo: number, dto: ChangeSismoStateDto, idUsuario: number) {
    const sismoRepo = this.dataSource.getRepository(Sismo);
    const evento = await sismoRepo.findOne({
      where: { idSismo },
      relations: ['estado'],
    });
    if (!evento) throw new NotFoundException('Evento sísmico no encontrado');

    if (
      evento.fechaUltimaActualizacion.getTime() !==
      new Date(dto.fechaUltimaActualizacion).getTime()
    ) {
      throw new ConflictException(
        'El evento fue modificado por otro usuario. Recargue la ficha antes de cambiar su estado.',
      );
    }

    const nuevoEstado = await this.estadoSismoRepo.findOne({
      where: { idEstadoSismo: dto.idEstadoSismo },
    });
    if (!nuevoEstado) throw new NotFoundException('El estado seleccionado no existe');

    const transicionesPermitidas: Record<string, string> = {
      Pendiente: 'Revisado',
      Revisado: 'Publicado',
    };
    const estadoEsperado = transicionesPermitidas[evento.estado.nombre];
    if (estadoEsperado !== nuevoEstado.nombre) {
      throw new BadRequestException(
        estadoEsperado
          ? `Desde ${evento.estado.nombre} solo se permite avanzar a ${estadoEsperado}`
          : `El estado ${evento.estado.nombre} no admite una transición manual posterior`,
      );
    }

    const nombreEstadoAnterior = evento.estado.nombre;
    await this.dataSource.transaction(async (manager) => {
      evento.idEstadoSismo = nuevoEstado.idEstadoSismo;
      evento.estado = nuevoEstado;
      evento.fechaUltimaActualizacion = new Date();
      await manager.save(evento);
      await manager.save(
        manager.create(HistorialEstadoSismo, {
          idSismo,
          idEstadoSismo: nuevoEstado.idEstadoSismo,
          idUsuario,
          observacion:
            dto.observacion?.trim() ||
            `Transición autorizada de ${nombreEstadoAnterior} a ${nuevoEstado.nombre}`,
        }),
      );
    });

    return {
      mensaje: `Evento actualizado al estado ${nuevoEstado.nombre}`,
      evento: await this.findOne(idSismo),
    };
  }

  async create(dto: CreateSismoDto, idUsuario: number) {
    await this.validarTerritorio(dto.idMunicipio, dto.idMacrodistrito);
    const [tipoMagnitud, estadoPendiente, fuente] = await Promise.all([
      this.tipoMagnitudRepo.findOne({ where: { idTipoMagnitud: dto.idTipoMagnitud } }),
      this.estadoSismoRepo.findOne({ where: { nombre: 'Pendiente' } }),
      this.fuenteSismicaRepo.findOne({ where: { idFuente: dto.idFuente, activa: true } }),
    ]);

    if (!tipoMagnitud) {
      throw new NotFoundException('El tipo de magnitud seleccionado no existe');
    }

    if (!estadoPendiente) {
      throw new UnprocessableEntityException(
        'No está configurado el estado inicial Pendiente',
      );
    }

    if (!fuente) {
      throw new NotFoundException('La fuente sísmica no existe o está inactiva');
    }

    const resultadoDuplicidad = await this.checkDuplicates(dto);
    if (
      resultadoDuplicidad.posibleDuplicado &&
      dto.confirmarPosibleDuplicado !== true
    ) {
      throw new ConflictException({
        message: 'Se encontraron posibles eventos duplicados. Se requiere confirmación explícita.',
        codigo: 'POSIBLE_DUPLICADO',
        ...resultadoDuplicidad,
      });
    }

    const idSismo = await this.dataSource.transaction(async (manager) => {
      const sismo = manager.create(Sismo, {
        idTipoMagnitud: tipoMagnitud.idTipoMagnitud,
        idEstadoSismo: estadoPendiente.idEstadoSismo,
        idUsuarioRegistro: idUsuario,
        idMunicipio: dto.idMunicipio || null,
        idMacrodistrito: dto.idMacrodistrito || null,
        fechaHoraUtc: new Date(dto.fechaHoraUtc),
        magnitud: dto.magnitud.toFixed(2),
        profundidadKm: dto.profundidadKm.toFixed(2),
        latitud: dto.latitud.toFixed(6),
        longitud: dto.longitud.toFixed(6),
        observacionReferencia: dto.observacionReferencia?.trim() || null,
      });
      const sismoGuardado = await manager.save(sismo);

      const sismoFuente = manager.create(SismoFuente, {
        idSismo: sismoGuardado.idSismo,
        idFuente: fuente.idFuente,
        identificadorExterno: dto.identificadorExterno?.trim() || null,
        fechaConsulta: new Date(),
        esFuentePrincipal: true,
      });
      await manager.save(sismoFuente);

      const historialInicial = manager.create(HistorialEstadoSismo, {
        idSismo: sismoGuardado.idSismo,
        idEstadoSismo: estadoPendiente.idEstadoSismo,
        idUsuario,
        observacion: 'Registro instrumental inicial del evento',
      });
      await manager.save(historialInicial);

      if (resultadoDuplicidad.posibleDuplicado) {
        const coincidencias = resultadoDuplicidad.candidatos.map((candidato) =>
          manager.create(PosibleDuplicadoSismo, {
            idSismoCandidato: sismoGuardado.idSismo,
            idSismoCoincidente: candidato.idSismo,
            estadoRevision: 'Pendiente de revisión',
            observacion: `Registro continuado por el Sismólogo. Coincidencias: ${candidato.motivos.join(', ')}`,
          }),
        );
        await manager.save(coincidencias);
      }

      return sismoGuardado.idSismo;
    });

    const evento = await this.dataSource.getRepository(Sismo).findOne({
      where: { idSismo },
      relations: ['tipoMagnitud', 'estado', 'fuentes', 'fuentes.fuente', 'municipio', 'macrodistrito'],
    });

    return {
      mensaje: 'Evento sísmico registrado correctamente',
      evento,
      advertenciaDuplicidad: resultadoDuplicidad.posibleDuplicado
        ? 'El evento fue registrado con coincidencias pendientes de revisión'
        : null,
    };
  }

  async checkDuplicates(dto: CreateSismoDto, excludeIdSismo?: number) {
    const fechaEvento = new Date(dto.fechaHoraUtc);
    const inicio = new Date(
      fechaEvento.getTime() - this.duplicateThresholds.tiempoSegundos * 1000,
    );
    const fin = new Date(
      fechaEvento.getTime() + this.duplicateThresholds.tiempoSegundos * 1000,
    );

    const sismoRepo = this.dataSource.getRepository(Sismo);
    const candidatosTemporales = await sismoRepo
      .createQueryBuilder('sismo')
      .leftJoinAndSelect('sismo.tipoMagnitud', 'tipoMagnitud')
      .leftJoinAndSelect('sismo.estado', 'estado')
      .leftJoinAndSelect('sismo.fuentes', 'sismoFuente')
      .leftJoinAndSelect('sismoFuente.fuente', 'fuente')
      .where('sismo.fecha_hora_utc BETWEEN :inicio AND :fin', { inicio, fin })
      .getMany();

    let candidatosIdentificador: Sismo[] = [];
    const identificadorExterno = dto.identificadorExterno?.trim();
    if (identificadorExterno) {
      candidatosIdentificador = await sismoRepo
        .createQueryBuilder('sismo')
        .leftJoinAndSelect('sismo.tipoMagnitud', 'tipoMagnitud')
        .leftJoinAndSelect('sismo.estado', 'estado')
        .leftJoinAndSelect('sismo.fuentes', 'sismoFuente')
        .leftJoinAndSelect('sismoFuente.fuente', 'fuente')
        .where('sismoFuente.id_fuente = :idFuente', { idFuente: dto.idFuente })
        .andWhere('LOWER(sismoFuente.identificador_externo) = LOWER(:identificador)', {
          identificador: identificadorExterno,
        })
        .getMany();
    }

    const eventosUnicos = new Map<number, Sismo>();
    [...candidatosTemporales, ...candidatosIdentificador].forEach((evento) =>
      evento.idSismo !== excludeIdSismo && eventosUnicos.set(evento.idSismo, evento),
    );

    const candidatos = [...eventosUnicos.values()]
      .map((evento) => {
        const diferenciaTiempoSegundos = Math.round(
          Math.abs(evento.fechaHoraUtc.getTime() - fechaEvento.getTime()) / 1000,
        );
        const distanciaKm = this.haversineKm(
          dto.latitud,
          dto.longitud,
          Number(evento.latitud),
          Number(evento.longitud),
        );
        const diferenciaMagnitud = Math.abs(Number(evento.magnitud) - dto.magnitud);
        const diferenciaProfundidadKm = Math.abs(
          Number(evento.profundidadKm) - dto.profundidadKm,
        );
        const mismoIdentificador = Boolean(
          identificadorExterno &&
            evento.fuentes.some(
              (relacion) =>
                relacion.idFuente === dto.idFuente &&
                relacion.identificadorExterno?.toLocaleLowerCase() ===
                  identificadorExterno.toLocaleLowerCase(),
            ),
        );

        const dentroDeUmbrales =
          diferenciaTiempoSegundos <= this.duplicateThresholds.tiempoSegundos &&
          distanciaKm <= this.duplicateThresholds.distanciaKm &&
          diferenciaMagnitud <= this.duplicateThresholds.magnitud &&
          diferenciaProfundidadKm <= this.duplicateThresholds.profundidadKm;

        if (!mismoIdentificador && !dentroDeUmbrales) return null;

        const motivos: string[] = [];
        if (mismoIdentificador) motivos.push('mismo identificador externo y fuente');
        if (diferenciaTiempoSegundos <= this.duplicateThresholds.tiempoSegundos) {
          motivos.push('proximidad temporal');
        }
        if (distanciaKm <= this.duplicateThresholds.distanciaKm) {
          motivos.push('proximidad geográfica');
        }
        if (diferenciaMagnitud <= this.duplicateThresholds.magnitud) {
          motivos.push('magnitud similar');
        }
        if (diferenciaProfundidadKm <= this.duplicateThresholds.profundidadKm) {
          motivos.push('profundidad similar');
        }

        const fuentePrincipal = evento.fuentes.find((relacion) => relacion.esFuentePrincipal);
        return {
          idSismo: evento.idSismo,
          fechaHoraUtc: evento.fechaHoraUtc,
          magnitud: Number(evento.magnitud),
          tipoMagnitud: evento.tipoMagnitud?.codigo,
          profundidadKm: Number(evento.profundidadKm),
          latitud: Number(evento.latitud),
          longitud: Number(evento.longitud),
          ubicacionReferencia: evento.observacionReferencia,
          estado: evento.estado?.nombre,
          fuente: fuentePrincipal?.fuente?.nombre || null,
          identificadorExterno: fuentePrincipal?.identificadorExterno || null,
          diferenciaTiempoSegundos,
          distanciaKm: Number(distanciaKm.toFixed(2)),
          diferenciaMagnitud: Number(diferenciaMagnitud.toFixed(2)),
          diferenciaProfundidadKm: Number(diferenciaProfundidadKm.toFixed(2)),
          motivos,
        };
      })
      .filter((candidato) => candidato !== null)
      .sort((a, b) => {
        const aMismoId = a.motivos.includes('mismo identificador externo y fuente');
        const bMismoId = b.motivos.includes('mismo identificador externo y fuente');
        if (aMismoId !== bMismoId) return aMismoId ? -1 : 1;
        return a.diferenciaTiempoSegundos - b.diferenciaTiempoSegundos;
      });

    return {
      posibleDuplicado: candidatos.length > 0,
      candidatos,
      umbralesAplicados: this.duplicateThresholds,
    };
  }

  private haversineKm(
    latitudOrigen: number,
    longitudOrigen: number,
    latitudDestino: number,
    longitudDestino: number,
  ) {
    const radioTierraKm = 6371.0088;
    const aRadianes = (valor: number) => (valor * Math.PI) / 180;
    const diferenciaLatitud = aRadianes(latitudDestino - latitudOrigen);
    const diferenciaLongitud = aRadianes(longitudDestino - longitudOrigen);
    const latitud1 = aRadianes(latitudOrigen);
    const latitud2 = aRadianes(latitudDestino);
    const haversine =
      Math.sin(diferenciaLatitud / 2) ** 2 +
      Math.cos(latitud1) *
        Math.cos(latitud2) *
        Math.sin(diferenciaLongitud / 2) ** 2;

    return 2 * radioTierraKm * Math.asin(Math.sqrt(haversine));
  }

  private toListItem(evento: Sismo) {
    const fuentePrincipal = evento.fuentes?.find((relacion) => relacion.esFuentePrincipal);
    return {
      idSismo: evento.idSismo,
      fechaHoraUtc: evento.fechaHoraUtc,
      magnitud: Number(evento.magnitud),
      profundidadKm: Number(evento.profundidadKm),
      ubicacionReferencia: evento.observacionReferencia,
      municipio: evento.municipio
        ? { idMunicipio: evento.municipio.idMunicipio, nombre: evento.municipio.nombre }
        : null,
      macrodistrito: evento.macrodistrito
        ? { idMacrodistrito: evento.macrodistrito.idMacrodistrito, nombre: evento.macrodistrito.nombre }
        : null,
      tipoMagnitud: {
        idTipoMagnitud: evento.tipoMagnitud.idTipoMagnitud,
        codigo: evento.tipoMagnitud.codigo,
        nombre: evento.tipoMagnitud.nombre,
      },
      estado: {
        idEstadoSismo: evento.estado.idEstadoSismo,
        nombre: evento.estado.nombre,
      },
      fuentePrincipal: fuentePrincipal
        ? {
            idFuente: fuentePrincipal.idFuente,
            nombre: fuentePrincipal.fuente.nombre,
            identificadorExterno: fuentePrincipal.identificadorExterno,
          }
        : null,
    };
  }

  private toDuplicateCase(caso: PosibleDuplicadoSismo) {
    return {
      idDuplicidad: caso.idDuplicidad,
      estadoRevision: caso.estadoRevision,
      observacion: caso.observacion,
      fechaDeteccion: caso.fechaDeteccion,
      fechaResolucion: caso.fechaResolucion,
      usuarioRevision: caso.usuarioRevision
        ? {
            idUsuario: caso.usuarioRevision.idUsuario,
            nombre: `${caso.usuarioRevision.nombre} ${caso.usuarioRevision.apellidos}`,
          }
        : null,
      eventoCandidato: this.toDuplicateEvent(caso.sismoCandidato),
      eventoCoincidente: this.toDuplicateEvent(caso.sismoCoincidente),
    };
  }

  private toDuplicateEvent(evento: Sismo) {
    const fuentePrincipal = evento.fuentes?.find((relacion) => relacion.esFuentePrincipal);
    return {
      idSismo: evento.idSismo,
      fechaHoraUtc: evento.fechaHoraUtc,
      magnitud: Number(evento.magnitud),
      tipoMagnitud: evento.tipoMagnitud.codigo,
      profundidadKm: Number(evento.profundidadKm),
      latitud: Number(evento.latitud),
      longitud: Number(evento.longitud),
      ubicacionReferencia: evento.observacionReferencia,
      estado: evento.estado.nombre,
      fuente: fuentePrincipal?.fuente?.nombre || null,
      identificadorExterno: fuentePrincipal?.identificadorExterno || null,
    };
  }
}
