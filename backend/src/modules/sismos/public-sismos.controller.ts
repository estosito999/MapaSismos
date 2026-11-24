import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PublicSismosQueryDto } from './dto/public-sismos-query.dto';
import { PublicSismosService } from './public-sismos.service';

@Controller('api/public/sismos')
export class PublicSismosController {
  constructor(private readonly service: PublicSismosService) {}

  @Get()
  catalogo(@Query() filtros: PublicSismosQueryDto) {
    return this.service.catalogo(filtros);
  }

  @Get('ubicaciones')
  ubicaciones() {
    return this.service.ubicaciones();
  }

  @Get('territorios')
  territorios() {
    return this.service.territorios();
  }

  @Get(':id')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(id);
  }
}
