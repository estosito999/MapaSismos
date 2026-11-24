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
import { AdminService } from './admin.service';
import { UpdateUserStatusDto } from './dto/update-status.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleName } from '../../common/constants/roles.constant';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMINISTRADOR)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listUsers(search, role);
  }

  @Get('roles')
  async getAllRoles() {
    return this.adminService.getAllRoles();
  }

  @Get('solicitudes-sismologo')
  async getSolicitudesSismologo() {
    return this.adminService.getSolicitudesSismologo();
  }

  @Post('solicitudes/:id/aprobar')
  async aprobarSolicitud(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.aprobarSolicitud(id);
  }

  @Post('solicitudes/:id/rechazar')
  async rechazarSolicitud(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.rechazarSolicitud(id);
  }

  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Post('users/:id/assign-role')
  async assignRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoleDto,
  ) {
    return this.adminService.assignRole(id, dto);
  }
}
