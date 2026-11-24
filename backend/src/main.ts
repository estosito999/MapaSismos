import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Usuario } from './modules/users/entities/usuario.entity';
import { Rol } from './modules/users/entities/rol.entity';
import { RoleName } from './common/constants/roles.constant';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const logger = new Logger('SismoPazBootstrap');
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para el frontend Next.js (puerto 3000)
  app.enableCors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Asegurar cuenta de Administrador por defecto para pruebas
  try {
    const usuarioRepo = app.get(getRepositoryToken(Usuario));
    const rolRepo = app.get(getRepositoryToken(Rol));

    const adminEmail = 'admin@sismopaz.bo';
    const existingAdmin = await usuarioRepo.findOne({ where: { correo: adminEmail } });

    if (!existingAdmin) {
      let rolAdmin = await rolRepo.findOne({ where: { nombre: RoleName.ADMINISTRADOR } });
      if (!rolAdmin) {
        rolAdmin = await rolRepo.save({
          nombre: RoleName.ADMINISTRADOR,
          descripcion: 'Gestión de cuentas y configuración',
        });
      }

      const passwordHash = await bcrypt.hash('Admin2026!', 12);
      const admin = usuarioRepo.create({
        nombre: 'Administrador',
        apellidos: 'SismoPaz',
        correo: adminEmail,
        passwordHash,
        telefono: '22113344',
        estado: true,
        roles: [rolAdmin],
      });
      await usuarioRepo.save(admin);
      logger.log(`✓ Administrador inicial creado: ${adminEmail} (pass: Admin2026!)`);
    }
  } catch (err) {
    logger.warn(`No se pudo verificar el usuario administrador inicial: ${err.message}`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`🚀 SismoPaz API REST ejecutándose en: http://localhost:${port}`);
}

bootstrap();
