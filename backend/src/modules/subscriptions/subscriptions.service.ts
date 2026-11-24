import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuscripcionAlerta } from './entities/suscripcion-alerta.entity';
import { Macrodistrito } from './entities/macrodistrito.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SuscripcionAlerta)
    private readonly suscripcionRepo: Repository<SuscripcionAlerta>,
    @InjectRepository(Macrodistrito)
    private readonly macrodistritoRepo: Repository<Macrodistrito>,
  ) {}

  async getMacrodistritos() {
    return this.macrodistritoRepo.find({ order: { nombre: 'ASC' } });
  }

  async getUserSubscriptions(idUsuario: number) {
    return this.suscripcionRepo.find({
      where: { idUsuario },
      relations: ['macrodistrito'],
      order: { fechaSuscripcion: 'DESC' },
    });
  }

  async createSubscription(idUsuario: number, idMacrodistrito: number) {
    const macro = await this.macrodistritoRepo.findOne({ where: { idMacrodistrito } });
    if (!macro) {
      throw new NotFoundException('Macrodistrito no encontrado');
    }

    const existing = await this.suscripcionRepo.findOne({
      where: { idUsuario, idMacrodistrito },
    });

    if (existing) {
      if (!existing.activa) {
        existing.activa = true;
        return this.suscripcionRepo.save(existing);
      }
      throw new ConflictException('Ya estás suscrito a este macrodistrito');
    }

    const nueva = this.suscripcionRepo.create({
      idUsuario,
      idMacrodistrito,
      activa: true,
    });

    return this.suscripcionRepo.save(nueva);
  }

  async removeSubscription(idUsuario: number, idSuscripcion: number) {
    const sub = await this.suscripcionRepo.findOne({
      where: { idSuscripcion, idUsuario },
    });

    if (!sub) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    await this.suscripcionRepo.remove(sub);
    return { mensaje: 'Suscripción eliminada correctamente' };
  }
}
