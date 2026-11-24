import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { PublicSismosQueryDto } from './dto/public-sismos-query.dto';
import { Sismo } from './entities/sismo.entity';

@Injectable()
export class PublicSismosService {
  constructor(private readonly dataSource: DataSource) {}

  async catalogo(filtros: PublicSismosQueryDto) {
    const pagina = filtros.pagina || 1;
    const limite = filtros.limite || 10;
    const base = this.aplicarFiltros(this.consultaPublicada(), filtros);
    const total = await base.clone().getCount();
    const eventos = await base.clone().orderBy('sismo.fechaHoraUtc', 'DESC').skip((pagina - 1) * limite).take(limite).getMany();
    const mapa = await base.clone().orderBy('sismo.fechaHoraUtc', 'DESC').take(5000).getMany();
    const area = await this.areaUrbana();
    return {
      eventos: eventos.map((e) => this.presentar(e, area)),
      mapaEventos: mapa.map((e) => this.presentar(e, area)),
      paginacion: { pagina, limite, total, totalPaginas: Math.max(1, Math.ceil(total / limite)) },
      mapaTruncado: total > 5000,
      referenciaCartografica: 'WGS 84 (EPSG:4326)',
      areaUrbana: area,
    };
  }

  async detalle(idSismo: number) {
    const evento = await this.consultaPublicada().andWhere('sismo.idSismo=:idSismo', { idSismo }).getOne();
    if (!evento) throw new NotFoundException('El evento publicado no existe');
    return this.presentar(evento, await this.areaUrbana());
  }

  async ubicaciones() {
    const filas = await this.dataSource.query(`SELECT DISTINCT TRIM(s.observacion_referencia) AS nombre FROM sismos s INNER JOIN estados_sismo e ON e.id_estado_sismo=s.id_estado_sismo WHERE e.nombre='Publicado' AND NULLIF(TRIM(s.observacion_referencia),'') IS NOT NULL ORDER BY nombre`);
    return filas.map((fila: any) => fila.nombre);
  }

  async territorios() {
    const municipios = await this.dataSource.query(`SELECT id_municipio AS "idMunicipio", nombre, departamento FROM municipios ORDER BY nombre`);
    const macrodistritos = await this.dataSource.query(`SELECT id_macrodistrito AS "idMacrodistrito", id_municipio AS "idMunicipio", nombre FROM macrodistritos ORDER BY nombre`);
    return { municipios, macrodistritos };
  }

  private async areaUrbana() {
    const [area] = await this.dataSource.query(`SELECT nombre, latitud_centro AS "latitudCentro", longitud_centro AS "longitudCentro", radio_km AS "radioKm", fuente, es_oficial AS "esOficial" FROM areas_urbanas_referencia WHERE activa=TRUE ORDER BY id_area LIMIT 1`);
    return area || null;
  }

  private consultaPublicada() {
    return this.dataSource.getRepository(Sismo).createQueryBuilder('sismo')
      .innerJoinAndSelect('sismo.tipoMagnitud', 'tipoMagnitud')
      .innerJoinAndSelect('sismo.estado', 'estado')
      .leftJoinAndSelect('sismo.fuentes', 'sismoFuente')
      .leftJoinAndSelect('sismoFuente.fuente', 'fuente')
      .leftJoinAndSelect('sismo.municipio', 'municipio')
      .leftJoinAndSelect('sismo.macrodistrito', 'macrodistrito')
      .where('estado.nombre=:estado', { estado: 'Publicado' });
  }

  private aplicarFiltros(query: SelectQueryBuilder<Sismo>, f: PublicSismosQueryDto) {
    if (f.fechaDesde) query.andWhere('sismo.fechaHoraUtc>=:fechaDesde', { fechaDesde: f.fechaDesde });
    if (f.fechaHasta) query.andWhere('sismo.fechaHoraUtc<=:fechaHasta', { fechaHasta: f.fechaHasta });
    if (f.magnitudMin !== undefined) query.andWhere('sismo.magnitud>=:magnitudMin', { magnitudMin: f.magnitudMin });
    if (f.magnitudMax !== undefined) query.andWhere('sismo.magnitud<=:magnitudMax', { magnitudMax: f.magnitudMax });
    if (f.idMunicipio) query.andWhere('sismo.idMunicipio=:idMunicipio', { idMunicipio: f.idMunicipio });
    if (f.idMacrodistrito) query.andWhere('sismo.idMacrodistrito=:idMacrodistrito', { idMacrodistrito: f.idMacrodistrito });
    if (f.ubicacion) query.andWhere('LOWER(sismo.observacionReferencia) LIKE LOWER(:ubicacion)', { ubicacion: `%${f.ubicacion.trim()}%` });
    return query;
  }

  private presentar(evento: Sismo, area: any) {
    const fuente = evento.fuentes?.find((x) => x.esFuentePrincipal) || evento.fuentes?.[0];
    const distanciaCentro = area ? this.haversineKm(Number(area.latitudCentro), Number(area.longitudCentro), Number(evento.latitud), Number(evento.longitud)) : null;
    return {
      id: evento.idSismo, occurredAt: evento.fechaHoraUtc, magnitude: Number(evento.magnitud),
      magnitudeType: evento.tipoMagnitud.codigo, depthKm: Number(evento.profundidadKm),
      latitude: Number(evento.latitud), longitude: Number(evento.longitud),
      location: evento.observacionReferencia || 'Ubicación no especificada',
      municipality: evento.municipio ? { id: evento.municipio.idMunicipio, name: evento.municipio.nombre } : null,
      macroDistrict: evento.macrodistrito ? { id: evento.macrodistrito.idMacrodistrito, name: evento.macrodistrito.nombre } : null,
      source: fuente?.fuente?.nombre || 'Fuente no especificada', externalId: fuente?.identificadorExterno || null,
      epicentralDistanceKm: Number(this.haversineKm(-16.4957, -68.1336, Number(evento.latitud), Number(evento.longitud)).toFixed(1)),
      urbanAreaDistanceKm: distanciaCentro === null ? null : Number(Math.max(0, distanciaCentro - Number(area.radioKm)).toFixed(1)),
      urbanAreaName: area?.nombre || null, urbanAreaSource: area?.fuente || null, urbanAreaOfficial: area?.esOficial || false,
    };
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const rad = (v: number) => v * Math.PI / 180;
    const dLat = rad(lat2 - lat1); const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.sqrt(a));
  }
}
