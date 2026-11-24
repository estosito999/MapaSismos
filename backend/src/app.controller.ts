import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get()
  getApiInfo() {
    return {
      sistema: 'SismoPaz — Sistema de Información Sísmica La Paz',
      version: '1.0.0',
      estado: 'Operativo',
      protocolo: 'REST / JSON',
      autenticacion: 'JWT Bearer (HMAC-SHA256, expiración 60m)',
      roles: ['Ciudadano', 'Sismólogo', 'Administrador'],
      modulos_disponibles: {
        autenticacion: [
          {
            metodo: 'POST',
            ruta: '/api/auth/register',
            acceso: 'Público',
            descripcion: 'Registro de ciudadano con correo y contraseña cifrada (bcrypt-12)',
          },
          {
            metodo: 'POST',
            ruta: '/api/auth/login',
            acceso: 'Público',
            descripcion: 'Inicio de sesión seguro; emite token JWT y registra sesión',
          },
          {
            metodo: 'POST',
            ruta: '/api/auth/logout',
            acceso: 'Autenticado',
            descripcion: 'Revoca la sesión activa en el servidor',
          },
        ],
        usuarios_y_perfiles: [
          {
            metodo: 'GET',
            ruta: '/api/users/profile',
            acceso: 'Autenticado',
            descripcion: 'Obtener información de perfil, rol único, acreditación y suscripciones',
          },
          {
            metodo: 'PATCH',
            ruta: '/api/users/profile',
            acceso: 'Autenticado',
            descripcion: 'Actualizar datos de contacto (nombres, apellidos, teléfono)',
          },
          {
            metodo: 'PATCH',
            ruta: '/api/users/password',
            acceso: 'Autenticado',
            descripcion: 'Cambio de contraseña (contraseña actual, nueva y confirmación)',
          },
          {
            metodo: 'POST',
            ruta: '/api/users/solicitar-sismologo',
            acceso: 'Ciudadano',
            descripcion: 'Postulación con matrícula e institución para cambio a rol Sismólogo',
          },
        ],
        macrodistritos_y_zonas: [
          {
            metodo: 'GET',
            ruta: '/api/macrodistritos',
            acceso: 'Público',
            descripcion: 'Catálogo de los 9 macrodistritos oficiales del Municipio de La Paz',
          },
          {
            metodo: 'POST',
            ruta: '/api/users/subscriptions',
            acceso: 'Autenticado',
            descripcion: 'Suscribir cuenta a un macrodistrito para alertas zonales (RNF02)',
          },
          {
            metodo: 'DELETE',
            ruta: '/api/users/subscriptions/:id',
            acceso: 'Autenticado',
            descripcion: 'Eliminar suscripción zonal a un macrodistrito',
          },
        ],
        administracion_y_gobernanza: [
          {
            metodo: 'GET',
            ruta: '/api/admin/users',
            acceso: 'Administrador',
            descripcion: 'Búsqueda y listado paginado/filtrado de cuentas de usuario',
          },
          {
            metodo: 'GET',
            ruta: '/api/admin/roles',
            acceso: 'Administrador',
            descripcion: 'Catálogo de roles del sistema',
          },
          {
            metodo: 'GET',
            ruta: '/api/admin/solicitudes-sismologo',
            acceso: 'Administrador',
            descripcion: 'Bandeja de matrículas pendientes de validación técnica',
          },
          {
            metodo: 'POST',
            ruta: '/api/admin/solicitudes/:id/aprobar',
            acceso: 'Administrador',
            descripcion: 'Validar matrícula técnica y asignar rol exclusivo de Sismólogo',
          },
          {
            metodo: 'POST',
            ruta: '/api/admin/solicitudes/:id/rechazar',
            acceso: 'Administrador',
            descripcion: 'Rechazar solicitud de acreditación sismológica',
          },
          {
            metodo: 'PATCH',
            ruta: '/api/admin/users/:id/status',
            acceso: 'Administrador',
            descripcion: 'Habilitar o suspender cuenta (revoca inmediatamente sesiones activas)',
          },
          {
            metodo: 'POST',
            ruta: '/api/admin/users/:id/assign-role',
            acceso: 'Administrador',
            descripcion: 'Asignar rol directo cumpliendo la regla de rol único por usuario',
          },
        ],
        registro_y_monitoreo_sismico: [
          {
            metodo: 'GET',
            ruta: '/api/sismos',
            acceso: 'Sismólogo',
            descripcion: 'Listado técnico paginado con filtros y orden cronológico',
          },
          {
            metodo: 'GET',
            ruta: '/api/sismos/:id',
            acceso: 'Sismólogo',
            descripcion: 'Ficha técnica, procedencia e historial de un evento',
          },
          {
            metodo: 'PATCH',
            ruta: '/api/sismos/:id',
            acceso: 'Sismólogo',
            descripcion: 'Actualización técnica con control de versión y auditoría campo por campo',
          },
          {
            metodo: 'PATCH',
            ruta: '/api/sismos/:id/estado',
            acceso: 'Sismólogo',
            descripcion: 'Transición controlada Pendiente, Revisado y Publicado',
          },
          {
            metodo: 'GET',
            ruta: '/api/sismos/:id/historial',
            acceso: 'Sismólogo',
            descripcion: 'Historial detallado de modificaciones técnicas',
          },
          {
            metodo: 'POST',
            ruta: '/api/sismos/verificar-duplicados',
            acceso: 'Sismólogo',
            descripcion: 'Busca coincidencias técnicas antes del registro de un evento',
          },
          {
            metodo: 'GET',
            ruta: '/api/sismos/duplicados',
            acceso: 'Sismólogo',
            descripcion: 'Bandeja paginada de coincidencias y sus resoluciones',
          },
          {
            metodo: 'PATCH',
            ruta: '/api/sismos/duplicados/:id/resolver',
            acceso: 'Sismólogo',
            descripcion: 'Registra la decisión técnica sobre una posible duplicidad',
          },
          {
            metodo: 'POST',
            ruta: '/api/sismos',
            acceso: 'Sismólogo',
            descripcion: 'Registra un evento, su procedencia y estado inicial Pendiente',
          },
          {
            metodo: 'GET',
            ruta: '/api/sismos/catalogos/tipos-magnitud',
            acceso: 'Sismólogo',
            descripcion: 'Catálogo de tipos de magnitud instrumental',
          },
          {
            metodo: 'GET',
            ruta: '/api/sismos/catalogos/estados',
            acceso: 'Sismólogo',
            descripcion: 'Catálogo de estados del evento sísmico',
          },
          {
            metodo: 'GET',
            ruta: '/api/sismos/catalogos/fuentes',
            acceso: 'Sismólogo',
            descripcion: 'Catálogo de fuentes sísmicas activas',
          },
        ],
      },
    };
  }
}
