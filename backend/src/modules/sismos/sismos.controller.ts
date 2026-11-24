import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSismoDto } from './dto/create-sismo.dto';
import { FilterSismosDto } from './dto/filter-sismos.dto';
import { UpdateSismoDto } from './dto/update-sismo.dto';
import { ChangeSismoStateDto } from './dto/change-sismo-state.dto';
import { FilterDuplicatesDto } from './dto/filter-duplicates.dto';
import { ResolveDuplicateDto } from './dto/resolve-duplicate.dto';
import { SismosService } from './sismos.service';

@Controller('api/sismos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SISMOLOGO)
export class SismosController {
  constructor(private readonly sismosService: SismosService) {}

  @Post()
  async create(
    @CurrentUser('idUsuario') idUsuario: number,
    @Body() dto: CreateSismoDto,
  ) {
    return this.sismosService.create(dto, idUsuario);
  }

  @Post('verificar-duplicados')
  async checkDuplicates(@Body() dto: CreateSismoDto) {
    return this.sismosService.checkDuplicates(dto);
  }

  @Post(':id/verificar-duplicados')
  async checkUpdateDuplicates(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSismoDto,
  ) {
    await this.sismosService.findOne(id);
    return this.sismosService.checkDuplicates(dto, id);
  }

  @Get()
  async findAll(@Query() filtros: FilterSismosDto) {
    return this.sismosService.findAll(filtros);
  }

  @Get('catalogos/tipos-magnitud')
  async getTiposMagnitud() {
    return this.sismosService.getTiposMagnitud();
  }

  @Get('catalogos/estados')
  async getEstados() {
    return this.sismosService.getEstados();
  }

  @Get('catalogos/fuentes')
  async getFuentes() {
    return this.sismosService.getFuentes();
  }

  @Get('catalogos/municipios')
  getMunicipios() {
    return this.sismosService.getMunicipios();
  }

  @Get('catalogos/macrodistritos')
  getMacrodistritos(@Query('idMunicipio') idMunicipio?: string) {
    return this.sismosService.getMacrodistritos(idMunicipio ? Number(idMunicipio) : undefined);
  }

  @Get('duplicados')
  async findDuplicateCases(@Query() filtros: FilterDuplicatesDto) {
    return this.sismosService.findDuplicateCases(filtros);
  }

  @Get('duplicados/:id')
  async findDuplicateCase(@Param('id', ParseIntPipe) id: number) {
    return this.sismosService.findDuplicateCase(id);
  }

  @Patch('duplicados/:id/resolver')
  async resolveDuplicateCase(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idUsuario') idUsuario: number,
    @Body() dto: ResolveDuplicateDto,
  ) {
    return this.sismosService.resolveDuplicateCase(id, dto, idUsuario);
  }

  @Get(':id/historial')
  async getChangeHistory(@Param('id', ParseIntPipe) id: number) {
    return this.sismosService.getChangeHistory(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idUsuario') idUsuario: number,
    @Body() dto: UpdateSismoDto,
  ) {
    return this.sismosService.update(id, dto, idUsuario);
  }

  @Patch(':id/estado')
  async changeState(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idUsuario') idUsuario: number,
    @Body() dto: ChangeSismoStateDto,
  ) {
    return this.sismosService.changeState(id, dto, idUsuario);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sismosService.findOne(id);
  }
}
