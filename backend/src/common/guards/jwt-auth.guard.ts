import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context?: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Acceso no autorizado. Inicie sesión para continuar.');
    }

    // Las cuentas creadas por el administrador deben cambiar su clave inicial (CI)
    const url: string = context?.switchToHttp().getRequest()?.url?.split('?')[0] || '';
    const permitidas = ['/api/users/password', '/api/users/profile', '/api/auth/logout'];
    if (user.requiereCambioClave && !permitidas.includes(url)) {
      throw new ForbiddenException('Debe cambiar su contraseña antes de continuar');
    }

    return user;
  }
}
