import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoSismo } from './entities/estado-sismo.entity';
import { FuenteSismica } from './entities/fuente-sismica.entity';
import { HistorialCambioSismo } from './entities/historial-cambio-sismo.entity';
import { HistorialEstadoSismo } from './entities/historial-estado-sismo.entity';
import { PosibleDuplicadoSismo } from './entities/posible-duplicado-sismo.entity';
import { SismoFuente } from './entities/sismo-fuente.entity';
import { Sismo } from './entities/sismo.entity';
import { TipoMagnitud } from './entities/tipo-magnitud.entity';
import { SismosController } from './sismos.controller';
import { SismosService } from './sismos.service';
import { PublicSismosController } from './public-sismos.controller';
import { PublicSismosService } from './public-sismos.service';
import { Municipio } from './entities/municipio.entity';
import { Macrodistrito } from '../subscriptions/entities/macrodistrito.entity';

export const SISMOS_ENTITIES = [
  TipoMagnitud,
  EstadoSismo,
  FuenteSismica,
  Sismo,
  SismoFuente,
  HistorialEstadoSismo,
  HistorialCambioSismo,
  PosibleDuplicadoSismo,
  Municipio,
  Macrodistrito,
];

@Module({
  imports: [TypeOrmModule.forFeature(SISMOS_ENTITIES)],
  controllers: [SismosController, PublicSismosController],
  providers: [SismosService, PublicSismosService],
  exports: [SismosService, TypeOrmModule],
})
export class SismosModule {}
